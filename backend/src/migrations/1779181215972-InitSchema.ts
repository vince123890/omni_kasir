import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1779181215972 implements MigrationInterface {
    name = 'InitSchema1779181215972'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`tenants\` (\`id\` int NOT NULL AUTO_INCREMENT, \`tenantCode\` varchar(20) NOT NULL, \`entityType\` enum ('PT', 'CV', 'UD') NOT NULL, \`name\` varchar(100) NOT NULL, \`fullName\` varchar(120) NOT NULL, \`phone\` varchar(20) NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_f99e4a3fc1c4e456a05beb7b33\` (\`tenantCode\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(100) NOT NULL, \`email\` varchar(100) NOT NULL, \`password\` varchar(255) NOT NULL, \`role\` enum ('admin', 'owner', 'admin_store', 'kasir') NOT NULL, \`tenantId\` int NULL, \`storeId\` int NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`passwordChangedAt\` datetime NULL, \`lastLogin\` datetime NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`tenant_id\` int NULL, UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`stores\` (\`id\` int NOT NULL AUTO_INCREMENT, \`storeCode\` varchar(20) NOT NULL, \`tenantId\` int NOT NULL, \`name\` varchar(100) NOT NULL, \`address\` text NOT NULL, \`phone\` varchar(20) NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`tenant_id\` int NULL, UNIQUE INDEX \`IDX_554e0a6db66ec7592bb017d7b7\` (\`storeCode\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`products\` (\`id\` int NOT NULL AUTO_INCREMENT, \`storeId\` int NOT NULL, \`tenantId\` int NOT NULL, \`sku\` varchar(20) NULL, \`name\` varchar(100) NOT NULL, \`category\` varchar(50) NOT NULL, \`unit\` varchar(20) NOT NULL, \`conversionUnit\` varchar(20) NULL, \`conversionRate\` int NULL, \`buyPrice\` int NOT NULL, \`sellPrice\` int NOT NULL, \`stock\` int NOT NULL DEFAULT '0', \`minStock\` int NOT NULL, \`barcode\` varchar(100) NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, \`store_id\` int NULL, \`tenant_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`transaction_items\` (\`id\` int NOT NULL AUTO_INCREMENT, \`transactionId\` int NOT NULL, \`productId\` int NOT NULL, \`productName\` varchar(100) NOT NULL, \`qty\` int NOT NULL, \`price\` int NOT NULL, \`subtotal\` int NOT NULL, \`transaction_id\` int NULL, \`product_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`transactions\` (\`id\` int NOT NULL AUTO_INCREMENT, \`transactionCode\` varchar(25) NOT NULL, \`storeId\` int NOT NULL, \`tenantId\` int NOT NULL, \`cashierId\` int NOT NULL, \`totalAmount\` int NOT NULL, \`paidAmount\` int NOT NULL, \`changeAmount\` int NOT NULL, \`paymentMethod\` enum ('CASH') NOT NULL DEFAULT 'CASH', \`status\` enum ('COMPLETED', 'VOIDED') NOT NULL DEFAULT 'COMPLETED', \`note\` text NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`store_id\` int NULL, \`tenant_id\` int NULL, \`cashier_id\` int NULL, UNIQUE INDEX \`IDX_45abaab02edd7df9226f0424af\` (\`transactionCode\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`subscription_plans\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(100) NOT NULL, \`price\` int NOT NULL, \`durationDays\` int NOT NULL, \`maxStores\` int NOT NULL, \`maxCashiersPerStore\` int NOT NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`isPopular\` tinyint NOT NULL DEFAULT 0, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_ae18a0f6e0143f06474aa8cef1\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`subscriptions\` (\`id\` int NOT NULL AUTO_INCREMENT, \`tenantId\` int NOT NULL, \`planId\` int NOT NULL, \`startAt\` date NOT NULL, \`expiredAt\` date NOT NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`tenant_id\` int NULL, \`plan_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`stock_opname_items\` (\`id\` int NOT NULL AUTO_INCREMENT, \`opnameId\` int NOT NULL, \`productId\` int NOT NULL, \`qtySystem\` int NOT NULL, \`qtyActual\` int NOT NULL, \`difference\` int NOT NULL, \`reason\` text NULL, \`opname_id\` int NULL, \`product_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`stock_opnames\` (\`id\` int NOT NULL AUTO_INCREMENT, \`opnameCode\` varchar(20) NOT NULL, \`storeId\` int NOT NULL, \`tenantId\` int NOT NULL, \`opnameDate\` date NOT NULL, \`createdBy\` int NOT NULL, \`status\` enum ('DRAFT', 'COMPLETED') NOT NULL DEFAULT 'COMPLETED', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`store_id\` int NULL, \`tenant_id\` int NULL, \`created_by\` int NULL, UNIQUE INDEX \`IDX_b28204a2b424242911e82c80fb\` (\`opnameCode\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`stock_movements\` (\`id\` int NOT NULL AUTO_INCREMENT, \`movementCode\` varchar(30) NOT NULL, \`productId\` int NOT NULL, \`storeId\` int NOT NULL, \`tenantId\` int NOT NULL, \`type\` enum ('IN', 'OUT', 'CONVERT', 'OPNAME') NOT NULL, \`qty\` int NOT NULL, \`qtyBefore\` int NOT NULL, \`qtyAfter\` int NOT NULL, \`referenceId\` varchar(100) NULL, \`note\` text NULL, \`createdBy\` int NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`product_id\` int NULL, \`store_id\` int NULL, \`tenant_id\` int NULL, \`created_by\` int NULL, UNIQUE INDEX \`IDX_37c15f64e8f4956056ff841144\` (\`movementCode\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD CONSTRAINT \`FK_109638590074998bb72a2f2cf08\` FOREIGN KEY (\`tenant_id\`) REFERENCES \`tenants\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`stores\` ADD CONSTRAINT \`FK_b65b13e803690c2055e7620cafa\` FOREIGN KEY (\`tenant_id\`) REFERENCES \`tenants\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`products\` ADD CONSTRAINT \`FK_68863607048a1abd43772b314ef\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`products\` ADD CONSTRAINT \`FK_9c365ebf78f0e8a6d9e4827ea70\` FOREIGN KEY (\`tenant_id\`) REFERENCES \`tenants\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`transaction_items\` ADD CONSTRAINT \`FK_5926425896b30c0d681fe879af0\` FOREIGN KEY (\`transaction_id\`) REFERENCES \`transactions\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`transaction_items\` ADD CONSTRAINT \`FK_027964fc28560d4d68a0de5ce30\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`transactions\` ADD CONSTRAINT \`FK_ae6c0d854cfbf0ad012cf82be25\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`transactions\` ADD CONSTRAINT \`FK_4f27188c6c1d993bc76aeddcded\` FOREIGN KEY (\`tenant_id\`) REFERENCES \`tenants\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`transactions\` ADD CONSTRAINT \`FK_4132d46e1153917ecec2bcc458c\` FOREIGN KEY (\`cashier_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`subscriptions\` ADD CONSTRAINT \`FK_f6ac03431c311ccb8bbd7d3af18\` FOREIGN KEY (\`tenant_id\`) REFERENCES \`tenants\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`subscriptions\` ADD CONSTRAINT \`FK_e45fca5d912c3a2fab512ac25dc\` FOREIGN KEY (\`plan_id\`) REFERENCES \`subscription_plans\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`stock_opname_items\` ADD CONSTRAINT \`FK_50987a28c8141f820cb39c8eea4\` FOREIGN KEY (\`opname_id\`) REFERENCES \`stock_opnames\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`stock_opname_items\` ADD CONSTRAINT \`FK_adba2f4a1a00330641c196f3190\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`stock_opnames\` ADD CONSTRAINT \`FK_2d3a2f18ee2ce6e4c257dc58cef\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`stock_opnames\` ADD CONSTRAINT \`FK_283b55d44112faee163b8219e2e\` FOREIGN KEY (\`tenant_id\`) REFERENCES \`tenants\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`stock_opnames\` ADD CONSTRAINT \`FK_2d1eedcc5f8b58ebc0c588390a8\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`stock_movements\` ADD CONSTRAINT \`FK_2c1bb05b80ddcc562cd28d826c6\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`stock_movements\` ADD CONSTRAINT \`FK_5914e3685851db1a0be9733594f\` FOREIGN KEY (\`store_id\`) REFERENCES \`stores\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`stock_movements\` ADD CONSTRAINT \`FK_30dd9acc22dcb6ae51d7d34f16d\` FOREIGN KEY (\`tenant_id\`) REFERENCES \`tenants\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`stock_movements\` ADD CONSTRAINT \`FK_0d3747894dc26f5f5c34f640d23\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`stock_movements\` DROP FOREIGN KEY \`FK_0d3747894dc26f5f5c34f640d23\``);
        await queryRunner.query(`ALTER TABLE \`stock_movements\` DROP FOREIGN KEY \`FK_30dd9acc22dcb6ae51d7d34f16d\``);
        await queryRunner.query(`ALTER TABLE \`stock_movements\` DROP FOREIGN KEY \`FK_5914e3685851db1a0be9733594f\``);
        await queryRunner.query(`ALTER TABLE \`stock_movements\` DROP FOREIGN KEY \`FK_2c1bb05b80ddcc562cd28d826c6\``);
        await queryRunner.query(`ALTER TABLE \`stock_opnames\` DROP FOREIGN KEY \`FK_2d1eedcc5f8b58ebc0c588390a8\``);
        await queryRunner.query(`ALTER TABLE \`stock_opnames\` DROP FOREIGN KEY \`FK_283b55d44112faee163b8219e2e\``);
        await queryRunner.query(`ALTER TABLE \`stock_opnames\` DROP FOREIGN KEY \`FK_2d3a2f18ee2ce6e4c257dc58cef\``);
        await queryRunner.query(`ALTER TABLE \`stock_opname_items\` DROP FOREIGN KEY \`FK_adba2f4a1a00330641c196f3190\``);
        await queryRunner.query(`ALTER TABLE \`stock_opname_items\` DROP FOREIGN KEY \`FK_50987a28c8141f820cb39c8eea4\``);
        await queryRunner.query(`ALTER TABLE \`subscriptions\` DROP FOREIGN KEY \`FK_e45fca5d912c3a2fab512ac25dc\``);
        await queryRunner.query(`ALTER TABLE \`subscriptions\` DROP FOREIGN KEY \`FK_f6ac03431c311ccb8bbd7d3af18\``);
        await queryRunner.query(`ALTER TABLE \`transactions\` DROP FOREIGN KEY \`FK_4132d46e1153917ecec2bcc458c\``);
        await queryRunner.query(`ALTER TABLE \`transactions\` DROP FOREIGN KEY \`FK_4f27188c6c1d993bc76aeddcded\``);
        await queryRunner.query(`ALTER TABLE \`transactions\` DROP FOREIGN KEY \`FK_ae6c0d854cfbf0ad012cf82be25\``);
        await queryRunner.query(`ALTER TABLE \`transaction_items\` DROP FOREIGN KEY \`FK_027964fc28560d4d68a0de5ce30\``);
        await queryRunner.query(`ALTER TABLE \`transaction_items\` DROP FOREIGN KEY \`FK_5926425896b30c0d681fe879af0\``);
        await queryRunner.query(`ALTER TABLE \`products\` DROP FOREIGN KEY \`FK_9c365ebf78f0e8a6d9e4827ea70\``);
        await queryRunner.query(`ALTER TABLE \`products\` DROP FOREIGN KEY \`FK_68863607048a1abd43772b314ef\``);
        await queryRunner.query(`ALTER TABLE \`stores\` DROP FOREIGN KEY \`FK_b65b13e803690c2055e7620cafa\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_109638590074998bb72a2f2cf08\``);
        await queryRunner.query(`DROP INDEX \`IDX_37c15f64e8f4956056ff841144\` ON \`stock_movements\``);
        await queryRunner.query(`DROP TABLE \`stock_movements\``);
        await queryRunner.query(`DROP INDEX \`IDX_b28204a2b424242911e82c80fb\` ON \`stock_opnames\``);
        await queryRunner.query(`DROP TABLE \`stock_opnames\``);
        await queryRunner.query(`DROP TABLE \`stock_opname_items\``);
        await queryRunner.query(`DROP TABLE \`subscriptions\``);
        await queryRunner.query(`DROP INDEX \`IDX_ae18a0f6e0143f06474aa8cef1\` ON \`subscription_plans\``);
        await queryRunner.query(`DROP TABLE \`subscription_plans\``);
        await queryRunner.query(`DROP INDEX \`IDX_45abaab02edd7df9226f0424af\` ON \`transactions\``);
        await queryRunner.query(`DROP TABLE \`transactions\``);
        await queryRunner.query(`DROP TABLE \`transaction_items\``);
        await queryRunner.query(`DROP TABLE \`products\``);
        await queryRunner.query(`DROP INDEX \`IDX_554e0a6db66ec7592bb017d7b7\` ON \`stores\``);
        await queryRunner.query(`DROP TABLE \`stores\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_f99e4a3fc1c4e456a05beb7b33\` ON \`tenants\``);
        await queryRunner.query(`DROP TABLE \`tenants\``);
    }

}
