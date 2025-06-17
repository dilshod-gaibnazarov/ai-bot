import { Injectable } from '@nestjs/common';
import { Ctx, On, Start, Update } from 'nestjs-telegraf';
import { BotService } from './bot.service';
import { Context } from 'telegraf';

@Update()
@Injectable()
export class BotUpdate {
  constructor(private readonly botService: BotService) {}

  @Start()
  onStart(@Ctx() ctx: Context) {
    return this.botService.onStart(ctx);
  }

  @On('text')
  onText(@Ctx() ctx: Context) {
    return this.botService.onText(ctx);
  }

  @On('photo')
  onPhoto(@Ctx() ctx: Context) {
    return this.botService.onPhoto(ctx);
  }

  @On('audio')
  onAudio(@Ctx() ctx: Context) {
    return this.botService.onAudioOrVoiceTranscription(ctx);
  }

  @On('voice')
  onVoice(@Ctx() ctx: Context) {
    return this.botService.onAudioOrVoiceTranscription(ctx);
  }
}
