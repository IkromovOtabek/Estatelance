import { Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => {
        const isProd = process.env.NODE_ENV === 'production';
        // Bitta MONGODB_URI bo'lsa shuni, bo'lmasa muhitga qarab MONGO_PROD/MONGO_DEV
        const uri =
          process.env.MONGODB_URI ||
          (isProd ? process.env.MONGO_PROD : process.env.MONGO_DEV);

        if (!uri) {
          // VPS deploy'da eng ko'p uchraydigan xato — aniq xabar beramiz
          throw new Error(
            'MongoDB ulanish manzili topilmadi. .env da MONGODB_URI (yoki MONGO_DEV/MONGO_PROD) ni belgilang.',
          );
        }

        new Logger('Database').log(`MongoDB connecting (${isProd ? 'production' : 'development'})...`);
        return { uri };
      },
    }),
  ],
})
export class DatabaseModule {}
