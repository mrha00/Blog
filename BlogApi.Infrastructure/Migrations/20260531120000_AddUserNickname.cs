using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BlogApi.Infrastructure.Migrations;

public partial class AddUserNickname : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "Nickname",
            table: "Users",
            type: "TEXT",
            nullable: false,
            defaultValue: "");

        migrationBuilder.Sql("""
            UPDATE Users SET Nickname = Username WHERE Nickname IS NULL OR Nickname = '';
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "Nickname",
            table: "Users");
    }
}
