package com.cryptoadviserapp

import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.work.Worker
import androidx.work.WorkerParameters

/**
 * WorkManager Worker that triggers HeadlessJS tasks periodically
 * This ensures AutoTrading checks run every minute even when app is killed
 */
class AutoTradingWorker(
    context: Context,
    workerParams: WorkerParameters
) : Worker(context, workerParams) {

    companion object {
        private const val TAG = "AutoTradingWorker"
    }

    override fun doWork(): Result {
        Log.d(TAG, "===== WorkManager triggered AutoTrading check =====")

        return try {
            // Trigger the HeadlessJS service
            val intent = Intent(applicationContext, AutoTradingCheckService::class.java)
            applicationContext.startService(intent)

            Log.d(TAG, "AutoTrading check service started successfully")
            Result.success()
        } catch (e: Exception) {
            Log.e(TAG, "Error triggering AutoTrading check: ${e.message}", e)
            Result.failure()
        }
    }
}
