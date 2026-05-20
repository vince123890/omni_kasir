import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from './modules/auth/auth.module'
import { AdminModule } from './modules/admin/admin.module'
import { OwnerModule } from './modules/owner/owner.module'
import { AdminStoreModule } from './modules/admin-store/admin-store.module'
import { KasirModule } from './modules/kasir/kasir.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.get<string>('DB_USERNAME', 'root'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_NAME', 'omnikasir_db'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        synchronize: false,
        charset: 'utf8mb4',
        logging: config.get('NODE_ENV') !== 'production',
        retryAttempts: 5,
        retryDelay: 3000,
        connectTimeout: 20000,
      }),
    }),
    AuthModule,
    AdminModule,
    OwnerModule,
    AdminStoreModule,
    KasirModule,
  ],
})
export class AppModule {}
