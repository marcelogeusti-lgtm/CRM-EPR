import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { PrismaService } from './prisma.service';

@Module({
  controllers: [ContactsController],
  providers: [PrismaService],
  exports: [],
})
export class ContactsModule {}
