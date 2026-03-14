import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApiClientService } from './api-client.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        baseURL: config.get<string>('SCENARIO_API_URL', 'http://localhost:4000'),
        headers: {
          Authorization: `Bearer ${config.get<string>('SCENARIO_API_KEY', '')}`,
          'Content-Type': 'application/json',
        },
        timeout: 30_000,
      }),
    }),
  ],
  providers: [ApiClientService],
  exports: [ApiClientService],
})
export class ApiClientModule {}
