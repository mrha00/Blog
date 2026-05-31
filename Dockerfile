FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY BlogApi.Core/BlogApi.Core.csproj BlogApi.Core/
COPY BlogApi.Infrastructure/BlogApi.Infrastructure.csproj BlogApi.Infrastructure/
COPY BlogApi.Services/BlogApi.Services.csproj BlogApi.Services/
COPY BlogApi.API/BlogApi.API.csproj BlogApi.API/
RUN dotnet restore BlogApi.API/BlogApi.API.csproj

COPY . .
RUN dotnet publish BlogApi.API/BlogApi.API.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
RUN mkdir -p /data /app/wwwroot/uploads
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "BlogApi.API.dll"]
