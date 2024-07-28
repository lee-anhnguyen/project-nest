import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldAvatar1722153662526 implements MigrationInterface {
    name = 'AddFieldAvatar1722153662526'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`avatar\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`avatar\``);
    }

}
