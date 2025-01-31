import { neon } from '@neondatabase/serverless'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config({ path: '.env.local' })

// 使用环境变量中的数据库URL，如果没有则使用新的数据库URL
const sql = neon(process.env.NEW_DATABASE_URL || process.env.DATABASE_URL!)

async function migrate() {
  try {
    // 启用 UUID 扩展
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`
    console.log('Enabled uuid-ossp extension')

    // 删除现有表
    await sql`DROP TABLE IF EXISTS usage_records`
    await sql`DROP TABLE IF EXISTS payment_history`
    await sql`DROP TABLE IF EXISTS auth_users`
    console.log('Dropped existing tables')

    // 创建用户表
    await sql`
      CREATE TABLE auth_users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255),
        name VARCHAR(255),
        github_id VARCHAR(255) UNIQUE,
        google_id VARCHAR(255) UNIQUE,
        stripe_customer_id VARCHAR(255) UNIQUE,
        stripe_subscription_id VARCHAR(255) UNIQUE,
        stripe_price_id VARCHAR(255),
        stripe_current_period_end TIMESTAMP WITH TIME ZONE,
        text_quota INTEGER DEFAULT -1,
        image_quota INTEGER DEFAULT 10,
        pdf_quota INTEGER DEFAULT 8,
        speech_quota INTEGER DEFAULT 5,
        video_quota INTEGER DEFAULT 2,
        quota_reset_at DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log('Created auth_users table')

    // 创建使用记录表
    await sql`
      CREATE TABLE usage_records (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES auth_users(id),
        type VARCHAR(20) NOT NULL,
        used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
      )
    `
    console.log('Created usage_records table')

    // 创建支付历史表
    await sql`
      CREATE TABLE payment_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES auth_users(id),
        stripe_invoice_id VARCHAR(255) UNIQUE,
        amount INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL,
        payment_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
      )
    `
    console.log('Created payment_history table')

    console.log('Migration completed successfully')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

migrate() 