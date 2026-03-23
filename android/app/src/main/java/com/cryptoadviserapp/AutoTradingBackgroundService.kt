package com.cryptoadviserapp

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.work.*
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig
import java.util.concurrent.TimeUnit

class AutoTradingBackgroundService : Service() {

    companion object {
        private const val CHANNEL_ID = "auto_trading_channel"
        private const val NOTIFICATION_ID = 1001
        private const val WORK_NAME = "AutoTradingWork"

        fun start(context: Context) {
            val intent = Intent(context, AutoTradingBackgroundService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, AutoTradingBackgroundService::class.java)
            context.stopService(intent)
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, createNotification())
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Start periodic check service
        startPeriodicCheck()
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Auto Trading Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Running auto trading system in background"
                setShowBadge(false)
            }

            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        val intent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M)
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            else
                PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("🤖 Auto Trading Active")
            .setContentText("Monitoring markets and managing trades")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun startPeriodicCheck() {
        // Use WorkManager for reliable periodic HeadlessJS execution
        val constraints = Constraints.Builder()
            .setRequiresBatteryNotLow(false) // Run even on low battery
            .setRequiresDeviceIdle(false) // Run even when device is active
            .build()

        val workRequest = PeriodicWorkRequestBuilder<AutoTradingWorker>(
            1, TimeUnit.MINUTES, // Repeat every 1 minute
            15, TimeUnit.SECONDS  // Flex interval (allows 15s flexibility)
        )
            .setConstraints(constraints)
            .build()

        // Enqueue the work with a unique name (replaces any existing work)
        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            WORK_NAME,
            ExistingPeriodicWorkPolicy.REPLACE,
            workRequest
        )

        android.util.Log.d("AutoTradingService", "WorkManager periodic work scheduled (1 minute interval)")
    }

    override fun onDestroy() {
        super.onDestroy()
        // Cancel the WorkManager work
        WorkManager.getInstance(this).cancelUniqueWork(WORK_NAME)
        android.util.Log.d("AutoTradingService", "WorkManager periodic work cancelled")
    }
}

// HeadlessJS Service for periodic trading checks (every 15 minutes)
class AutoTradingCheckService : HeadlessJsTaskService() {

    override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig? {
        return intent?.let {
            HeadlessJsTaskConfig(
                "AutoTradingCheck",
                Arguments.createMap(),
                1 * 60 * 1000, // 1 minute timeout (pour tests, était 15 minutes)
                true // Allow in foreground
            )
        }
    }
}

// HeadlessJS Service for monitoring active trades (real-time)
class TradeMonitoringService : HeadlessJsTaskService() {

    override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig? {
        return intent?.let {
            HeadlessJsTaskConfig(
                "TradeMonitoring",
                Arguments.createMap(),
                60 * 60 * 1000, // 60 minutes timeout (keeps running)
                true // Allow in foreground
            )
        }
    }
}
