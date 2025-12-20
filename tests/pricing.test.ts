import { describe, it, expect } from 'vitest';
import { AFFILIATE_CREDITS_RULES, FISHERMAN_PLANS, FISHERMAN_TRIAL_DAYS, PREMIUM_PLANS, SMS_PACKS } from '../src/config/pricing';

describe('Pricing Configuration', () => {
  it('should have 7-day trial for fisherman plans', () => {
    expect(FISHERMAN_TRIAL_DAYS).toBe(7);
  });

  describe('Fisherman Plans', () => {
    it('should have correct STANDARD plan pricing', () => {
      expect(FISHERMAN_PLANS.STANDARD.priceCents).toBe(15000);
      expect(FISHERMAN_PLANS.STANDARD.openingBonusSms).toBe(200);
      expect(FISHERMAN_PLANS.STANDARD.smsQuotaMonthly).toBe(50);
      expect(FISHERMAN_PLANS.STANDARD.crmContacts).toBe(500);
      expect(FISHERMAN_PLANS.STANDARD.salePoints).toBe(1);
      expect(FISHERMAN_PLANS.STANDARD.affiliateSmsCapMonthly).toBe(200);
    });

    it('should have correct PRO plan pricing', () => {
      expect(FISHERMAN_PLANS.PRO.priceCents).toBe(29900);
      expect(FISHERMAN_PLANS.PRO.openingBonusSms).toBe(1000);
      expect(FISHERMAN_PLANS.PRO.smsQuotaMonthly).toBe(200);
      expect(FISHERMAN_PLANS.PRO.crmContacts).toBe(2000);
      expect(FISHERMAN_PLANS.PRO.salePoints).toBe(3);
      expect(FISHERMAN_PLANS.PRO.affiliateSmsCapMonthly).toBeNull();
      expect(FISHERMAN_PLANS.PRO.recommended).toBe(true);
    });

    it('should have correct ELITE plan pricing', () => {
      expect(FISHERMAN_PLANS.ELITE.priceCents).toBe(19900);
      expect(FISHERMAN_PLANS.ELITE.period).toBe('month');
      expect(FISHERMAN_PLANS.ELITE.smsQuotaMonthly).toBe(1500);
      expect(FISHERMAN_PLANS.ELITE.overageEnabled).toBe(true);
      expect(FISHERMAN_PLANS.ELITE.overagePricePerSmsCents).toBe(9);
      expect(FISHERMAN_PLANS.ELITE.crmContacts).toBe(10000);
      expect(FISHERMAN_PLANS.ELITE.salePoints).toBe(10);
    });
  });

  describe('Premium Plans', () => {
    it('should have correct PREMIUM plan pricing', () => {
      expect(PREMIUM_PLANS.PREMIUM.priceAnnualCents).toBe(2500);
      expect(PREMIUM_PLANS.PREMIUM.affiliateCreditCents).toBe(800);
    });

    it('should have correct PREMIUM_PLUS plan pricing', () => {
      expect(PREMIUM_PLANS.PREMIUM_PLUS.priceAnnualCents).toBe(4000);
      expect(PREMIUM_PLANS.PREMIUM_PLUS.affiliateCreditCents).toBe(1800);
    });
  });

  describe('SMS Packs', () => {
    it('should have 4 SMS packs defined', () => {
      expect(Object.keys(SMS_PACKS)).toHaveLength(4);
    });

    it('should have correct PACK_LANCEMENT as recommended', () => {
      expect(SMS_PACKS.PACK_LANCEMENT.recommended).toBe(true);
      expect(SMS_PACKS.PACK_LANCEMENT.quantity).toBe(1000);
      expect(SMS_PACKS.PACK_LANCEMENT.priceCents).toBe(9500);
      expect(SMS_PACKS.PACK_LANCEMENT.priceCentsPro).toBe(8500);
    });

    it('should have better prices for PRO plan', () => {
      expect(SMS_PACKS.PACK_500.priceCentsPro).toBeLessThan(SMS_PACKS.PACK_500.priceCents);
      expect(SMS_PACKS.PACK_LANCEMENT.priceCentsPro).toBeLessThan(SMS_PACKS.PACK_LANCEMENT.priceCents);
    });
  });
});

describe('Affiliate Credits Calculation', () => {
  it('should calculate SMS credits for Premium (8€)', () => {
    const credits = AFFILIATE_CREDITS_RULES.calculateSmsCredits(800);
    expect(credits).toBe(114); // floor(800/7)
  });

  it('should calculate SMS credits for Premium+ (18€)', () => {
    const credits = AFFILIATE_CREDITS_RULES.calculateSmsCredits(1800);
    expect(credits).toBe(257); // floor(1800/7)
  });

  it('should not allow negative credits', () => {
    const credits = AFFILIATE_CREDITS_RULES.calculateSmsCredits(-100);
    expect(credits).toBe(0);
  });

  it('should handle zero credits', () => {
    const credits = AFFILIATE_CREDITS_RULES.calculateSmsCredits(0);
    expect(credits).toBe(0);
  });

  it('should calculate correct SMS credits for various amounts', () => {
    expect(AFFILIATE_CREDITS_RULES.calculateSmsCredits(700)).toBe(100);
    expect(AFFILIATE_CREDITS_RULES.calculateSmsCredits(350)).toBe(50);
    expect(AFFILIATE_CREDITS_RULES.calculateSmsCredits(70)).toBe(10);
    expect(AFFILIATE_CREDITS_RULES.calculateSmsCredits(6)).toBe(0); // Not enough for 1 SMS
  });

  it('should return correct affiliate cap by plan', () => {
    expect(AFFILIATE_CREDITS_RULES.getAffiliateCap('fisherman_standard')).toBe(200);
    expect(AFFILIATE_CREDITS_RULES.getAffiliateCap('fisherman_pro')).toBeNull();
    expect(AFFILIATE_CREDITS_RULES.getAffiliateCap('fisherman_elite')).toBeNull();
  });

  it('should have referral bonus defined', () => {
    expect(AFFILIATE_CREDITS_RULES.REFERRAL_BONUS_SMS).toBe(300);
  });
});
