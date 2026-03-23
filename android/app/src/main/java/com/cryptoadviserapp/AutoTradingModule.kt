package com.cryptoadviserapp

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AutoTradingModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "AutoTradingModule"
    }

    @ReactMethod
    fun startBackgroundService() {
        AutoTradingBackgroundService.start(reactApplicationContext)
    }

    @ReactMethod
    fun stopBackgroundService() {
        AutoTradingBackgroundService.stop(reactApplicationContext)
    }
}
