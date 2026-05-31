using BlogApi.Core.Entities;
using BlogApi.Core.Interfaces;
using BlogApi.Core.Models.Tags;

namespace BlogApi.Services.Services;

public class TagService : ITagService
{
    private readonly ITagRepository _tagRepository;

    public TagService(ITagRepository tagRepository)
    {
        _tagRepository = tagRepository;
    }

    public async Task<List<TagItem>> GetAllAsync()
    {
        var tags = await _tagRepository.GetAllAsync();
        return tags.Select(t => new TagItem(t.Id, t.Name)).ToList();
    }

    public async Task<TagItem> CreateAsync(CreateTagRequest request)
    {
        if (await _tagRepository.NameExistsAsync(request.Name))
        {
            throw new InvalidOperationException("标签名已存在");
        }

        var tag = new Tag { Name = request.Name };
        tag = await _tagRepository.AddAsync(tag);
        return new TagItem(tag.Id, tag.Name);
    }
}
