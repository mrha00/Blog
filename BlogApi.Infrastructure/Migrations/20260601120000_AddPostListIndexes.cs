using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BlogApi.Infrastructure.Migrations;

public partial class AddPostListIndexes : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateIndex(
            name: "IX_Posts_Status",
            table: "Posts",
            column: "Status");

        migrationBuilder.CreateIndex(
            name: "IX_Posts_CreatedAt",
            table: "Posts",
            column: "CreatedAt");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_Posts_Status",
            table: "Posts");

        migrationBuilder.DropIndex(
            name: "IX_Posts_CreatedAt",
            table: "Posts");
    }
}
