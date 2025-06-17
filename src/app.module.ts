import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { BotModule } from './bot/bot.module';

@Module({
  imports: [
    TelegrafModule.forRoot({
      token: '7733421157:AAEZL6z00L8RtRfEPoSN0Q-4eVgVYpX97TM',
    }),
    BotModule,
  ],
})
export class AppModule {}
