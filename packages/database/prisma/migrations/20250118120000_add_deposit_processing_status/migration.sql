-- Migration: add PROCESSING to DepositStatus enum
ALTER TYPE "DepositStatus" ADD VALUE IF NOT EXISTS 'PROCESSING' BEFORE 'APPROVED';
