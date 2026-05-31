using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BlogApi.Infrastructure.Migrations;

public partial class AddUserAvatarUrl : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "AvatarUrl",
            table: "Users",
            type: "TEXT",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "AvatarUrl",
            table: "Users");
    }
}
