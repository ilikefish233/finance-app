import { NextResponse } from 'next/server'

export function successResponse(data?: any, message?: string) {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status: 200 }
  )
}

export function errorResponse(error: string, status: number = 400) {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  )
}

export function serverErrorResponse(error: any, message: string = '服务器内部错误') {
  console.error(message, error)
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status: 500 }
  )
}

export function createdResponse(data?: any, message?: string) {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status: 201 }
  )
}

export function noContentResponse() {
  return new NextResponse(null, { status: 204 })
}

export function validationErrorResponse(error: any, message: string = '输入数据验证失败') {
  console.error('验证错误:', error)
  return NextResponse.json(
    {
      success: false,
      error: message,
      details: error.errors || error.issues || error
    },
    { status: 400 }
  )
}

export function unauthorizedResponse(message: string = '未授权') {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status: 401 }
  )
}

export function forbiddenResponse(message: string = '无权限访问') {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status: 403 }
  )
}

export function notFoundResponse(message: string = '资源不存在') {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status: 404 }
  )
}
