import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { BotModule } from './bot/bot.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    TelegrafModule.forRoot({
      token: String(process.env.BOT_TOKEN),
    }),
    BotModule,
  ],
})
export class AppModule {}
