/**
 * Master Feature Flag for Multi-Saku (Multi-Wallet system).
 * 
 * - Set to `false` to pause the feature across the entire app.
 *   When paused:
 *   - Saku Switcher is hidden from the Dashboard and Quick Add.
 *   - Bottom Navigation defaults strictly to: Tracker (/), Savings (/savings), Compare (/compare).
 *   - The Multi-Saku Hub (/saku) gracefully redirects to Savings (/savings).
 *   - Multi-Saku mode toggle in User Menu is hidden.
 *   - Database models, triggers, and schemas remain completely intact for future resumption.
 * 
 * - Set to `true` to seamlessly re-enable the Multi-Saku system anytime.
 */
export const FEATURE_MULTI_SAKU_ENABLED = false;
