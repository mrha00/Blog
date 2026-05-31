using BlogApi.Core.Entities;

namespace BlogApi.Core.Interfaces;

public interface ITagRepository
{
    Task<List<Tag>> GetAllAsync();
    Task<List<Tag>> GetByIdsAsync(IEnumerable<int> ids);
    Task<Tag> AddAsync(Tag tag);
    Task<bool> NameExistsAsync(string name);
}
