import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { MaterialsModule } from './materials/materials.module';
import { GameModule } from './game/game.module';
import { ApiClientModule } from './api-client/api-client.module';

@Module({
  imports: [
    // Load .env at the root level; mark as global so every module sees it
    ConfigModule.forRoot({ isGlobal: true }),

    // Shared HttpModule — configured per-consumer via ApiClientModule
    HttpModule,

    ApiClientModule,
    MaterialsModule,
    GameModule,
  ],
})
export class AppModule {}
