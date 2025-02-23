import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

export async function POST(req: Request) {
  const { email, password, name } = await req.json();

  try {
    const { email: validatedEmail, password: validatedPassword, name: validatedName } = userSchema.parse({
      email,
      password,
      name,
    });

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedEmail },
    });

    if (!existingUser) {
      // Register new user
      const hashedPassword = await bcrypt.hash(validatedPassword, 10);
      const user = await prisma.user.create({
        data: {
          email: validatedEmail,
          password: hashedPassword,
          name: validatedName,
        },
      });

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || '', {
        expiresIn: '24h',
      });

      return NextResponse.json({ token });
    } else {
      // Login existing user
      const isValidPassword = await bcrypt.compare(validatedPassword, existingUser.password);
      if (!isValidPassword) {
        return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
      }

      const token = jwt.sign({ userId: existingUser.id }, process.env.JWT_SECRET || '', {
        expiresIn: '24h',
      });

      return NextResponse.json({ token });
    }
  } catch (error) {
    return NextResponse.json({ message: error.errors }, { status: 400 });
  }
} 