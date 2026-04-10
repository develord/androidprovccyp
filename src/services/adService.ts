// AdMob Rewarded Video Service
import { RewardedAd, RewardedAdEventType, AdEventType, TestIds } from 'react-native-google-mobile-ads';

// Use test IDs in dev, replace with real IDs for production
const AD_UNIT_ID = __DEV__
  ? TestIds.REWARDED
  : 'ca-app-pub-9009231639779757/9427723095';

class AdService {
  private rewardedAd: RewardedAd | null = null;
  private isLoaded = false;
  private isLoading = false;

  /**
   * Preload a rewarded video ad
   */
  load(): void {
    if (this.isLoading || this.isLoaded) return;
    this.isLoading = true;

    this.rewardedAd = RewardedAd.createForAdRequest(AD_UNIT_ID);

    const unsubLoaded = this.rewardedAd.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        this.isLoaded = true;
        this.isLoading = false;
        unsubLoaded();
      },
    );

    const unsubError = this.rewardedAd.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        console.error('Ad failed to load:', error);
        this.isLoaded = false;
        this.isLoading = false;
        unsubError();
        // Retry after 30s
        setTimeout(() => this.load(), 30000);
      },
    );

    this.rewardedAd.load();
  }

  /**
   * Show the rewarded video ad
   * @returns Promise<boolean> - true if user earned reward (watched full video)
   */
  show(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.rewardedAd || !this.isLoaded) {
        this.load();
        resolve(false);
        return;
      }

      let earned = false;

      const unsubEarned = this.rewardedAd.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        () => {
          earned = true;
          unsubEarned();
        },
      );

      const unsubClosed = this.rewardedAd.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          unsubClosed();
          resolve(earned);
          // Preload next ad
          this.isLoaded = false;
          this.rewardedAd = null;
          this.load();
        },
      );

      this.rewardedAd.show();
    });
  }

  /**
   * Check if an ad is ready to show
   */
  isReady(): boolean {
    return this.isLoaded;
  }
}

export default new AdService();
