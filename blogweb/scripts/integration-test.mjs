const BASE = process.env.VITE_API_BASE_URL || 'http://localhost:6133';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  console.log(`Integration test against ${BASE}`);
  let passed = 0;

  const check = (condition, message) => {
    assert(condition, message);
    passed += 1;
  };

  const health = await request('/health');
  check(health.status === 200, `health failed: ${health.status}`);

  const loginAdmin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: '123456' }),
  });
  check(loginAdmin.status === 200 && loginAdmin.body.token, 'admin login failed');
  const adminToken = loginAdmin.body.token;
  const adminAuth = { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' };

  const loginAlice = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'alice', password: '123456' }),
  });
  check(loginAlice.status === 200 && loginAlice.body.role === 'User', 'alice login failed');

  const unauthCreate = await request('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'x', content: 'y', categoryId: 1 }),
  });
  check(unauthCreate.status === 401, 'unauthenticated create should return 401');

  const categories = await request('/api/categories');
  check(categories.status === 200 && categories.body.length > 0, 'no categories');
  const categoryId = categories.body[0].id;

  const catName = `int-cat-${Date.now()}`;
  const createCat = await request('/api/categories', {
    method: 'POST',
    headers: adminAuth,
    body: JSON.stringify({ name: catName, description: 'integration test' }),
  });
  check(createCat.status === 200 || createCat.status === 201, 'create category failed');
  const newCatId = createCat.body.id;

  const updateCat = await request(`/api/categories/${newCatId}`, {
    method: 'PUT',
    headers: adminAuth,
    body: JSON.stringify({ name: `${catName}-upd`, description: 'updated' }),
  });
  check(updateCat.status === 200, 'update category failed');

  const tags = await request('/api/tags');
  check(tags.status === 200 && Array.isArray(tags.body), 'tags list failed');

  const tagName = `int-tag-${Date.now()}`;
  const createTag = await request('/api/tags', {
    method: 'POST',
    headers: adminAuth,
    body: JSON.stringify({ name: tagName }),
  });
  check(createTag.status === 200 || createTag.status === 201, 'create tag failed');
  const tagId = createTag.body.id;

  const updatedTagName = `${tagName}-upd`;
  const updateTagRes = await request(`/api/tags/${tagId}`, {
    method: 'PUT',
    headers: adminAuth,
    body: JSON.stringify({ name: updatedTagName }),
  });
  check(updateTagRes.status === 200 && updateTagRes.body.name === updatedTagName, 'update tag failed');

  await request(`/api/tags/${tagId}`, { method: 'DELETE', headers: adminAuth });

  const postTitle = `integration-${Date.now()}`;
  const create = await request('/api/posts', {
    method: 'POST',
    headers: adminAuth,
    body: JSON.stringify({
      title: postTitle,
      content: 'integration test body',
      categoryId,
      tagIds: [],
    }),
  });
  check(
    create.status === 200 || create.status === 201,
    `create post failed: ${create.status} ${JSON.stringify(create.body)}`
  );
  check(create.body.status === 0 || create.body.status === 'Draft', 'expected draft status');
  const postId = create.body.id;

  const draft = await request(`/api/posts/${postId}/draft`, {
    method: 'POST',
    headers: adminAuth,
  });
  check(draft.status === 200, 'draft endpoint failed');

  const publish = await request(`/api/posts/${postId}/publish`, {
    method: 'POST',
    headers: adminAuth,
  });
  check(publish.status === 200, 'publish failed');
  check(publish.body.status === 1 || publish.body.status === 'Published', 'expected published');

  const update = await request(`/api/posts/${postId}`, {
    method: 'PUT',
    headers: adminAuth,
    body: JSON.stringify({
      title: `${postTitle}-edited`,
      content: 'updated body',
      categoryId,
      tagIds: [],
    }),
  });
  check(update.status === 200, 'update post failed');

  const list = await request('/api/posts?page=1&pageSize=5');
  check(list.status === 200 && Array.isArray(list.body.items), 'list failed');

  const search = await request(`/api/posts?keyword=${encodeURIComponent(postTitle)}`);
  check(search.status === 200, 'search failed');

  const detail = await request(`/api/posts/${postId}`);
  check(detail.status === 200, 'detail failed');

  const aliceAuth = {
    Authorization: `Bearer ${loginAlice.body.token}`,
    'Content-Type': 'application/json',
  };
  const comment = await request(`/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: aliceAuth,
    body: JSON.stringify({ content: 'integration comment', parentId: null }),
  });
  check(comment.status === 200 || comment.status === 201, 'create comment failed');
  const commentId = comment.body.id;

  const comments = await request(`/api/posts/${postId}/comments`);
  check(comments.status === 200 && comments.body.length > 0, 'list comments failed');

  const deleteComment = await request(`/api/comments/${commentId}`, {
    method: 'DELETE',
    headers: aliceAuth,
  });
  check(deleteComment.status === 204, 'delete comment failed');

  const invalidCover = await request('/api/posts', {
    method: 'POST',
    headers: adminAuth,
    body: JSON.stringify({
      title: `bad-cover-${Date.now()}`,
      content: 'body',
      categoryId,
      tagIds: [],
      coverUrl: 'https://evil.example/x.png',
    }),
  });
  check(invalidCover.status === 400, 'invalid coverUrl should return 400');

  const nestedPost = await request('/api/posts', {
    method: 'POST',
    headers: adminAuth,
    body: JSON.stringify({
      title: `nested-del-${Date.now()}`,
      content: 'nested delete test',
      categoryId,
      tagIds: [],
    }),
  });
  check(nestedPost.status === 200 || nestedPost.status === 201, 'nested post create failed');
  const nestedPostId = nestedPost.body.id;
  await request(`/api/posts/${nestedPostId}/publish`, { method: 'POST', headers: adminAuth });

  const rootComment = await request(`/api/posts/${nestedPostId}/comments`, {
    method: 'POST',
    headers: aliceAuth,
    body: JSON.stringify({ content: 'root', parentId: null }),
  });
  check(rootComment.status === 200 || rootComment.status === 201, 'root comment failed');
  const replyComment = await request(`/api/posts/${nestedPostId}/comments`, {
    method: 'POST',
    headers: aliceAuth,
    body: JSON.stringify({ content: 'reply', parentId: rootComment.body.id }),
  });
  check(replyComment.status === 200 || replyComment.status === 201, 'reply comment failed');

  const deleteNestedPost = await request(`/api/posts/${nestedPostId}`, {
    method: 'DELETE',
    headers: adminAuth,
  });
  check(deleteNestedPost.status === 204, 'delete post with nested comments failed');

  const mine = await request('/api/posts/mine?page=1&pageSize=5', { headers: adminAuth });
  check(mine.status === 200 && Array.isArray(mine.body.items), 'mine posts failed');

  const me = await request('/api/auth/me', { headers: adminAuth });
  check(me.status === 200 && me.body.username === 'admin', 'auth me failed');

  const updateProfile = await request('/api/auth/profile', {
    method: 'PUT',
    headers: adminAuth,
    body: JSON.stringify({ nickname: '集成测试管理员' }),
  });
  check(updateProfile.status === 200 && updateProfile.body.nickname === '集成测试管理员', 'update profile failed');

  const badAvatar = await request('/api/auth/profile', {
    method: 'PUT',
    headers: adminAuth,
    body: JSON.stringify({ avatarUrl: 'https://evil.example/a.png' }),
  });
  check(badAvatar.status === 400, 'invalid avatarUrl should return 400');

  const wrongPwd = await request('/api/auth/password', {
    method: 'PUT',
    headers: adminAuth,
    body: JSON.stringify({ currentPassword: 'wrong', newPassword: '654321' }),
  });
  check(wrongPwd.status === 401, 'wrong current password should return 401');

  await request('/api/auth/profile', {
    method: 'PUT',
    headers: adminAuth,
    body: JSON.stringify({ nickname: '博客管理员' }),
  });

  await request(`/api/posts/${postId}`, { method: 'DELETE', headers: adminAuth });
  await request(`/api/categories/${newCatId}`, { method: 'DELETE', headers: adminAuth });

  console.log(`Integration tests passed: ${passed}/${passed}`);
}

main().catch((err) => {
  console.error('Integration tests failed:', err.message);
  process.exit(1);
});
