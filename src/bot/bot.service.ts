import { Injectable } from '@nestjs/common';
import { Context } from 'telegraf';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import * as FormData from 'form-data';

const apiKey = String(process.env.CHATGPT_API_KEY);
const token = String(process.env.BOT_TOKEN);

const openai = new OpenAI({ apiKey });

const imageKeywords = [
  'rasm chizib ber',
  'chizib ber',
  'tasvirlab ber',
  "reallikdagi rasmini ko'rsat",
];

const audioKeywords = [
  "audioga o'girib ber",
  'audio formatda generatsiya qilib ber',
  "audio shaklda jo'nat",
  'audio format',
];

@Injectable()
export class BotService {
  async onStart(ctx: Context) {
    try {
      ctx.reply(`Sun'iy intellekt botga xush kelibsiz`);
    } catch (error) {
      console.log(error);
      ctx.reply(error.message);
    }
  }

  async onText(ctx: Context) {
    try {
      const prompt =
        ctx.message && 'text' in ctx.message ? ctx.message.text : 'danggg';
      const isAudio = audioKeywords.find((keyword) => prompt.includes(keyword));
      const isImage = imageKeywords.find((keyword) => prompt.includes(keyword));
      if (isAudio) {
        const audio = prompt.split(isAudio)[0];
        const voice = 'echo';
        const fileName = `axmoq-gpt_${Date.now()}.mp3`;
        const filePath = path.join(__dirname, fileName);
        const response = await axios.post(
          'https://api.openai.com/v1/audio/speech',
          {
            model: 'tts-1',
            input: audio,
            voice: voice,
            response_format: 'mp3',
          },
          {
            responseType: 'arraybuffer',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        );
        fs.writeFileSync(filePath, response.data);
        await ctx.replyWithAudio({ source: filePath });
        fs.unlinkSync(filePath);
      } else if (isImage) {
        if (!prompt)
          return ctx.reply(
            'Iltimos, rasm yaratish uchun matnli so‘rov yuboring.',
          );
        console.log(prompt);
        const imageResponse: any = await openai.images.generate({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
        });
        const imageUrl = imageResponse.data[0].url;
        if (imageUrl) {
          ctx.replyWithPhoto(imageUrl);
        } else {
          ctx.reply('Rasm generatsiya qilishda muammo yuz berdi.');
        }
      } else {
        const response = await openai.responses.create({
          model: 'gpt-4.1',
          input: [
            {
              role: 'developer',
              content: 'Sen har sohani biluvchi professional odamsan',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        });
        if (response.output_text) {
          ctx.reply(response.output_text);
        } else {
          ctx.reply('Nimadur xato ketdi');
        }
      }
    } catch (error) {
      console.log(error);
      ctx.reply('Xatolik yuz berdi: ' + error.message);
    }
  }

  async onPhoto(ctx: Context) {
    try {
      if (!ctx.message || !('photo' in ctx.message)) {
        return ctx.reply('Iltimos, rasm yuboring.');
      }
      const photo = ctx.message.photo;
      const fileId = photo[photo.length - 1].file_id;
      const file = await ctx.telegram.getFile(fileId);
      const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Shu rasmda nimalar bor, nimani tushunding, sharhlab ber',
              },
              {
                type: 'image_url',
                image_url: {
                  url: fileUrl,
                  detail: 'auto',
                },
              },
            ],
          },
        ],
      });
      const answer = response.choices[0]?.message?.content;
      if (answer) {
        ctx.reply(answer);
      } else {
        ctx.reply('Javob olinmadi.');
      }
    } catch (error: any) {
      console.error(error);
      ctx.reply('Xatolik yuz berdi: ' + error.message);
    }
  }

  async onAudioOrVoiceTranscription(ctx: Context) {
    try {
      if (!ctx.message || !('voice' in ctx.message || 'audio' in ctx.message)) {
        return ctx.reply('Iltimos, ovozli xabar yoki audio yuboring.');
      }
      const fileId =
        'voice' in ctx.message
          ? ctx.message.voice.file_id
          : ctx.message.audio.file_id;
      const file = await ctx.telegram.getFile(fileId);
      const filePath = file.file_path;
      const downloadUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
      const response = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
      });
      const fileName = `audio_${Date.now()}.ogg`;
      const localFilePath = path.join(__dirname, fileName);
      fs.writeFileSync(localFilePath, response.data);
      const formData = new FormData();
      formData.append('file', fs.createReadStream(localFilePath));
      formData.append('model', 'whisper-1');
      const transcription = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${apiKey}`,
          },
        },
      );
      ctx.reply(`${transcription.data.text}`);
      fs.unlinkSync(localFilePath);
    } catch (error) {
      console.error(error);
      ctx.reply('Xatolik yuz berdi: ' + error.message);
    }
  }
}
