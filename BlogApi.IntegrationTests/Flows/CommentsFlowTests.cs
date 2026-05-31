using System.Net;
using System.Net.Http.Json;
using BlogApi.IntegrationTests.Helpers;

namespace BlogApi.IntegrationTests.Flows;

[Collection("Integration")]
public class CommentsFlowTests
{
    private readonly HttpClient _client;

    public CommentsFlowTests(BlogApiWebApplicationFactory factory)
    {
        factory.EnsureSeeded();
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CommentAndReply_ReturnNestedStructure()
    {
        var postId = await CreatePublishedPostAsync();

        var userToken = await _client.RegisterAndGetTokenAsync(
            $"commenter_{Guid.NewGuid():N}",
            $"commenter_{Guid.NewGuid():N}@test.local",
            "Test123!");
        _client.SetBearerToken(userToken);

        var top = await _client.PostAsJsonAsync($"/api/posts/{postId}/comments", new
        {
            content = "Top comment"
        });
        top.EnsureSuccessStatusCode();
        var topBody = await HttpClientExtensions.ReadJsonAsync<CommentResponse>(top);

        var reply = await _client.PostAsJsonAsync($"/api/posts/{postId}/comments", new
        {
            content = "Reply comment",
            parentId = topBody!.Id
        });
        reply.EnsureSuccessStatusCode();

        _client.ClearBearerToken();
        var tree = await _client.GetAsync($"/api/posts/{postId}/comments");
        tree.EnsureSuccessStatusCode();
        var comments = await HttpClientExtensions.ReadJsonAsync<List<CommentNode>>(tree);

        var root = Assert.Single(comments!, c => c.Id == topBody.Id);
        Assert.Contains(root.Replies, r => r.Content == "Reply comment");
    }

    [Fact]
    public async Task UserCannotDeleteOthersComment_Returns403()
    {
        var postId = await CreatePublishedPostAsync();

        var userAToken = await _client.RegisterAndGetTokenAsync(
            $"userA_{Guid.NewGuid():N}",
            $"userA_{Guid.NewGuid():N}@test.local",
            "Test123!");
        var userBToken = await _client.RegisterAndGetTokenAsync(
            $"userB_{Guid.NewGuid():N}",
            $"userB_{Guid.NewGuid():N}@test.local",
            "Test123!");

        _client.SetBearerToken(userAToken);
        var comment = await _client.PostAsJsonAsync($"/api/posts/{postId}/comments", new
        {
            content = "Owned by A"
        });
        comment.EnsureSuccessStatusCode();
        var commentBody = await HttpClientExtensions.ReadJsonAsync<CommentResponse>(comment);

        _client.SetBearerToken(userBToken);
        var delete = await _client.DeleteAsync($"/api/comments/{commentBody!.Id}");

        Assert.Equal(HttpStatusCode.Forbidden, delete.StatusCode);
    }

    private async Task<int> CreatePublishedPostAsync()
    {
        var adminToken = await _client.LoginAndGetTokenAsync("admin", "123456");
        var authorToken = await _client.RegisterAndGetTokenAsync(
            $"author_{Guid.NewGuid():N}",
            $"author_{Guid.NewGuid():N}@test.local",
            "Test123!");

        _client.SetBearerToken(adminToken);
        var category = await _client.PostAsJsonAsync("/api/categories", new
        {
            name = $"Cat_{Guid.NewGuid():N}",
            description = "integration"
        });
        category.EnsureSuccessStatusCode();
        var categoryBody = await HttpClientExtensions.ReadJsonAsync<CategoryResponse>(category);

        _client.SetBearerToken(authorToken);
        var create = await _client.PostAsJsonAsync("/api/posts", new
        {
            title = $"Post_{Guid.NewGuid():N}",
            content = "content",
            summary = "summary",
            categoryId = categoryBody!.Id,
            tagIds = Array.Empty<int>()
        });
        create.EnsureSuccessStatusCode();
        var post = await HttpClientExtensions.ReadJsonAsync<PostResponse>(create);

        var publish = await _client.PostAsync($"/api/posts/{post!.Id}/publish", null);
        publish.EnsureSuccessStatusCode();
        return post.Id;
    }

    private sealed class CategoryResponse
    {
        public int Id { get; set; }
    }

    private sealed class PostResponse
    {
        public int Id { get; set; }
    }

    private sealed class CommentResponse
    {
        public int Id { get; set; }
    }

    private sealed class CommentNode
    {
        public int Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public List<CommentNode> Replies { get; set; } = new();
    }
}
