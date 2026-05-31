using BlogApi.Core.Models.Tags;

namespace BlogApi.Core.Interfaces;

public interface ITagService
{
    Task<List<TagItem>> GetAllAsync();
    Task<TagItem> CreateAsync(CreateTagRequest request);
    Task<TagItem> UpdateAsync(int id, UpdateTagRequest request);
    Task DeleteAsync(int id);
}
