using BlogApi.IntegrationTests;
using Xunit;

[assembly: CollectionBehavior(DisableTestParallelization = true)]

[CollectionDefinition("Integration")]
public class IntegrationCollection : ICollectionFixture<BlogApiWebApplicationFactory>;
