import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { SessionStore } from './session.store';
import { ApiClientModule } from '../api-client/api-client.module';

@Module({
  imports: [ApiClientModule],
  controllers: [GameController],
  providers: [GameService, SessionStore],
})
export class GameModule {}
