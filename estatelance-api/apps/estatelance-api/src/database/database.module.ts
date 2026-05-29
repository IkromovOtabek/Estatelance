import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => ({
        // Use development DB locally, production DB on the server
        uri:
          process.env.NODE_ENV === 'production'
            ? process.env.MONGO_PROD
            : process.env.MONGO_DEV,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
