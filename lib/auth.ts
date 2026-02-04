import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from './db'

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return await bcrypt.hash(password, salt)
}

export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword)
}

export async function getUserFromRequest(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  if (!token) return null

  try {
    const user = await prisma.user.findFirst({ where: { id: token } })
    return user
  } catch (error) {
    return null
  }
}

export function setAuthCookie(response: NextResponse, userId: string) {
  response.cookies.set('auth-token', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

export function removeAuthCookie(response: NextResponse) {
  response.cookies.delete('auth-token')
}

export async function createSession(userId: string) {
  // 这里可以实现更复杂的会话管理，目前我们直接使用cookie
  return userId
}

export async function destroySession() {
  // 这里可以实现更复杂的会话管理
  return true
}

export async function requireAuth(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  
  if (!token) {
    throw new Error('未授权')
  }
  
  try {
    const user = await prisma.user.findFirst({ where: { id: token } })
    if (!user) {
      throw new Error('未授权')
    }
    return user.id
  } catch (error) {
    throw new Error('未授权')
  }
}

export async function getCurrentUser(request: NextRequest) {
  return await getUserFromRequest(request)
}