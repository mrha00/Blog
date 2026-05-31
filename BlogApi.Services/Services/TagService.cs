using BlogApi.Core.Entities;
using BlogApi.Core.Exceptions;
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
        var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("标签名不能为空");
        }

        if (await _tagRepository.NameExistsAsync(name))
        {
            throw new InvalidOperationException("标签名已存在");
        }

        var tag = new Tag { Name = name };
        tag = await _tagRepository.AddAsync(tag);
        return new TagItem(tag.Id, tag.Name);
    }

    public async Task<TagItem> UpdateAsync(int id, UpdateTagRequest request)
    {
        var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("标签名不能为空");
        }

        var tag = await _tagRepository.GetByIdAsync(id)
            ?? throw new NotFoundException("标签不存在");

        if (await _tagRepository.NameExistsAsync(name, id))
        {
            throw new InvalidOperationException("标签名已存在");
        }

        tag.Name = name;
        tag = await _tagRepository.UpdateAsync(tag);
        return new TagItem(tag.Id, tag.Name);
    }

    public async Task DeleteAsync(int id)
    {
        var tag = await _tagRepository.GetByIdAsync(id)
            ?? throw new NotFoundException("标签不存在");

        if (await _tagRepository.IsUsedByPostsAsync(id))
        {
            throw new InvalidOperationException("标签已被文章使用，无法删除");
        }

        await _tagRepository.DeleteAsync(tag);
    }
}
