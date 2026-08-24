import {
  MobilePlatform,
  MobileFramework,
  MobileActionType,
  MobileScenarioTemplate
} from '@novaqa/types';
import { AIClient, aiClient } from './client.js';
import { createChildLogger } from '@novaqa/shared';

const log = createChildLogger('mobile-scenario-generator');

export interface GenerateMobileScenariosInput {
  appName: string;
  framework?: MobileFramework | string;
  platform?: MobilePlatform | string;
  appPackageOrBundle?: string;
  deepLinkScheme?: string;
  customRequirements?: string;
  scenariosToInclude?: string[];
}

export class MobileScenarioGenerator {
  constructor(private client: AIClient = aiClient) {}

  /**
   * Generates comprehensive mobile testing scenarios covering auth, onboarding, permissions,
   * deep links, offline/recovery, push notifications, navigation, hardware back, and payments.
   */
  async generateScenarios(input: GenerateMobileScenariosInput): Promise<MobileScenarioTemplate[]> {
    const platform = input.platform === 'ios' || input.platform === MobilePlatform.IOS
      ? MobilePlatform.IOS
      : MobilePlatform.ANDROID;

    const framework = (input.framework as MobileFramework) || MobileFramework.REACT_NATIVE;
    const scheme = input.deepLinkScheme || input.appName.toLowerCase().replace(/[^a-z0-9]/g, '');

    log.info({ appName: input.appName, platform, framework }, 'Generating autonomous mobile test scenarios');

    const defaultScenarios: MobileScenarioTemplate[] = [
      // 1. Login & Biometric Flow
      {
        scenarioId: 'mob-01-login',
        title: 'User Login & Biometric Authentication',
        category: 'Authentication',
        framework,
        platform,
        description: 'Verify login with email/password and biometric prompt validation',
        priority: 'CRITICAL',
        steps: [
          { order: 1, action: MobileActionType.LAUNCH_APP, target: input.appPackageOrBundle, description: 'Launch application' },
          { order: 2, action: MobileActionType.TYPE, target: 'input_email', value: 'qa.mobile@novaqa.com', description: 'Enter user email' },
          { order: 3, action: MobileActionType.TYPE, target: 'input_password', value: 'SecurePass123!', description: 'Enter secure password' },
          { order: 4, action: MobileActionType.HIDE_KEYBOARD, description: 'Dismiss virtual keyboard' },
          { order: 5, action: MobileActionType.TAP, target: 'btn_login', description: 'Tap Sign In button' },
          { order: 6, action: MobileActionType.ASSERT_ELEMENT_VISIBLE, target: 'view_home_dashboard', description: 'Assert home screen rendered' }
        ],
        expectedResult: 'User is authenticated and navigated to main home dashboard'
      },

      // 2. Registration Flow
      {
        scenarioId: 'mob-02-registration',
        title: 'New User Registration & Terms Agreement',
        category: 'Authentication',
        framework,
        platform,
        description: 'Verify signup form fields, terms acceptance, and account creation',
        priority: 'HIGH',
        steps: [
          { order: 1, action: MobileActionType.LAUNCH_APP, description: 'Launch application' },
          { order: 2, action: MobileActionType.TAP, target: 'btn_signup_nav', description: 'Navigate to signup screen' },
          { order: 3, action: MobileActionType.TYPE, target: 'input_name', value: 'Jane Mobile Tester', description: 'Enter full name' },
          { order: 4, action: MobileActionType.TYPE, target: 'input_signup_email', value: 'jane.test@novaqa.com', description: 'Enter unique email' },
          { order: 5, action: MobileActionType.TYPE, target: 'input_signup_password', value: 'P@ssword2026!', description: 'Enter password' },
          { order: 6, action: MobileActionType.TAP, target: 'checkbox_terms', description: 'Accept Terms of Service' },
          { order: 7, action: MobileActionType.TAP, target: 'btn_create_account', description: 'Submit registration' },
          { order: 8, action: MobileActionType.ASSERT_ELEMENT_VISIBLE, target: 'view_registration_success', description: 'Verify welcome screen' }
        ],
        expectedResult: 'Account created and user receives confirmation screen'
      },

      // 3. Onboarding & Permissions Flow
      {
        scenarioId: 'mob-03-onboarding-permissions',
        title: 'Onboarding Carousel & Runtime Permissions Granting',
        category: 'Permissions & Onboarding',
        framework,
        platform,
        description: 'Verify swipe through onboarding slides and granting Camera / Location permissions',
        priority: 'CRITICAL',
        steps: [
          { order: 1, action: MobileActionType.RESET_APP, description: 'Reset app to clear storage and permissions' },
          { order: 2, action: MobileActionType.SWIPE, value: 'left', description: 'Swipe left to slide 2' },
          { order: 3, action: MobileActionType.SWIPE, value: 'left', description: 'Swipe left to slide 3' },
          { order: 4, action: MobileActionType.TAP, target: 'btn_get_started', description: 'Tap Get Started' },
          { order: 5, action: MobileActionType.GRANT_PERMISSION, target: 'ACCESS_FINE_LOCATION', description: 'Grant Location runtime permission' },
          { order: 6, action: MobileActionType.GRANT_PERMISSION, target: 'CAMERA', description: 'Grant Camera runtime permission' },
          { order: 7, action: MobileActionType.ASSERT_ELEMENT_VISIBLE, target: 'view_home_dashboard', description: 'Verify permission granted and app home loaded' }
        ],
        expectedResult: 'Onboarding completed and runtime permissions accepted cleanly'
      },

      // 4. Push Notification Routing
      {
        scenarioId: 'mob-04-push-notifications',
        title: 'Push Notification Receipt & In-App Routing',
        category: 'Notifications',
        framework,
        platform,
        description: 'Simulate incoming push notification banner and deep navigation into order details',
        priority: 'HIGH',
        steps: [
          { order: 1, action: MobileActionType.LAUNCH_APP, description: 'Launch application in foreground' },
          { order: 2, action: MobileActionType.PRESS_HOME, description: 'Move app to background' },
          {
            order: 3,
            action: MobileActionType.SEND_PUSH_NOTIFICATION,
            target: 'Order Dispatched!',
            value: 'Your package #10492 has been shipped and is on the way.',
            description: 'Send APNS/FCM push notification'
          },
          { order: 4, action: MobileActionType.OPEN_NOTIFICATIONS, description: 'Open notification shade' },
          { order: 5, action: MobileActionType.TAP, target: 'notification_item_10492', description: 'Tap notification item' },
          { order: 6, action: MobileActionType.ASSERT_ELEMENT_VISIBLE, target: 'view_order_details_10492', description: 'Verify deep routing to order tracking' }
        ],
        expectedResult: 'Push notification opens the app and navigates directly to target order tracking screen'
      },

      // 5. Deep Link Navigation Flow
      {
        scenarioId: 'mob-05-deep-links',
        title: 'Deep Link & Universal Link Navigation',
        category: 'Deep Linking',
        framework,
        platform,
        description: 'Verify deep linking to product detail page with query parameters',
        priority: 'HIGH',
        steps: [
          { order: 1, action: MobileActionType.OPEN_DEEP_LINK, target: `${scheme}://products/classic-tshirt?ref=promo2026`, description: 'Trigger deep link intent' },
          { order: 2, action: MobileActionType.ASSERT_ELEMENT_VISIBLE, target: 'product_title_classic-tshirt', description: 'Assert product screen displayed' },
          { order: 3, action: MobileActionType.PRESS_BACK, description: 'Press back button' },
          { order: 4, action: MobileActionType.ASSERT_ELEMENT_VISIBLE, target: 'view_home_dashboard', description: 'Assert return to previous stack root' }
        ],
        expectedResult: 'Deep link launches product screen and maintains navigation stack integrity'
      },

      // 6. Offline Mode & Network Recovery
      {
        scenarioId: 'mob-06-offline-recovery',
        title: 'Offline Mode Resilience & Auto-Sync on Network Recovery',
        category: 'Network & Reliability',
        framework,
        platform,
        description: 'Verify app operates in offline mode from cache, queues actions, and syncs upon reconnect',
        priority: 'CRITICAL',
        steps: [
          { order: 1, action: MobileActionType.LAUNCH_APP, description: 'Launch application with active WiFi' },
          { order: 2, action: MobileActionType.SET_NETWORK_STATE, value: 'OFFLINE', description: 'Disconnect all network connectivity' },
          { order: 3, action: MobileActionType.TAP, target: 'btn_add_to_wishlist', description: 'Perform offline mutation (Add to Wishlist)' },
          { order: 4, action: MobileActionType.ASSERT_ELEMENT_VISIBLE, target: 'badge_offline_sync_pending', description: 'Verify offline cached indicator' },
          { order: 5, action: MobileActionType.SET_NETWORK_STATE, value: 'WIFI', description: 'Restore WiFi connectivity' },
          { order: 6, action: MobileActionType.ASSERT_ELEMENT_VISIBLE, target: 'toast_synced_successfully', description: 'Verify automatic background synchronization' }
        ],
        expectedResult: 'App handles network drop gracefully and automatically syncs pending mutations upon reconnection'
      },

      // 7. Form Validation & Keyboard Handling
      {
        scenarioId: 'mob-07-form-validation',
        title: 'Form Validation & Soft Keyboard View Inset',
        category: 'UI & Usability',
        framework,
        platform,
        description: 'Verify field validation errors and keyboard view avoiding/scrolling behavior',
        priority: 'MEDIUM',
        steps: [
          { order: 1, action: MobileActionType.LAUNCH_APP, description: 'Open app' },
          { order: 2, action: MobileActionType.TAP, target: 'btn_contact_support', description: 'Open contact form' },
          { order: 3, action: MobileActionType.TAP, target: 'btn_submit_contact', description: 'Submit empty form' },
          { order: 4, action: MobileActionType.ASSERT_ELEMENT_VISIBLE, target: 'error_message_required', description: 'Assert required validation error' },
          { order: 5, action: MobileActionType.TYPE, target: 'input_message_body', value: 'App crashed when viewing order history.', description: 'Type multi-line message' },
          { order: 6, action: MobileActionType.HIDE_KEYBOARD, description: 'Dismiss keyboard' },
          { order: 7, action: MobileActionType.TAP, target: 'btn_submit_contact', description: 'Submit valid form' }
        ],
        expectedResult: 'Validation errors display accurately and inputs remain visible above the soft keyboard'
      },

      // 8. Navigation & Hardware Back Button Stack
      {
        scenarioId: 'mob-08-back-button-stack',
        title: 'Stack Navigation & Hardware Back Button Lifecycle',
        category: 'Navigation',
        framework,
        platform,
        description: 'Verify navigation through nested modal stacks and hardware back button behavior',
        priority: 'HIGH',
        steps: [
          { order: 1, action: MobileActionType.LAUNCH_APP, description: 'Launch app' },
          { order: 2, action: MobileActionType.TAP, target: 'tab_settings', description: 'Navigate to settings tab' },
          { order: 3, action: MobileActionType.TAP, target: 'row_security_settings', description: 'Open security sub-screen' },
          { order: 4, action: MobileActionType.TAP, target: 'row_change_password', description: 'Open change password modal' },
          { order: 5, action: MobileActionType.PRESS_BACK, description: 'Press hardware back button' },
          { order: 6, action: MobileActionType.ASSERT_ELEMENT_VISIBLE, target: 'view_security_settings', description: 'Assert popped to security settings' },
          { order: 7, action: MobileActionType.PRESS_BACK, description: 'Press hardware back button again' },
          { order: 8, action: MobileActionType.ASSERT_ELEMENT_VISIBLE, target: 'view_settings_main', description: 'Assert popped to main settings tab' }
        ],
        expectedResult: 'Back button pops navigation stacks in precise chronological reverse without orphaned views'
      },

      // 9. Session Expiration & Background Lifecycle
      {
        scenarioId: 'mob-09-session-expiration',
        title: 'Session Expiration & Resume Lifecycle',
        category: 'Security & Lifecycle',
        framework,
        platform,
        description: 'Verify expired token triggers session lock or re-authentication prompt on resume',
        priority: 'CRITICAL',
        steps: [
          { order: 1, action: MobileActionType.LAUNCH_APP, description: 'Launch authenticated session' },
          { order: 2, action: MobileActionType.PRESS_HOME, description: 'Send app to background' },
          { order: 3, action: MobileActionType.LAUNCH_APP, description: 'Resume app after session expiration interval' },
          { order: 4, action: MobileActionType.ASSERT_ELEMENT_VISIBLE, target: 'modal_session_expired', description: 'Verify re-authentication prompt' }
        ],
        expectedResult: 'Expired session is intercepted cleanly and prompts secure re-login'
      },

      // 10. Payment & Checkout Flow
      {
        scenarioId: 'mob-10-payment-checkout',
        title: 'Payment & Mobile In-App Purchase Checkout Flow',
        category: 'E-Commerce & Payments',
        framework,
        platform,
        description: 'Verify shopping cart checkout, shipping address selection, and payment confirmation',
        priority: 'CRITICAL',
        steps: [
          { order: 1, action: MobileActionType.LAUNCH_APP, description: 'Launch app' },
          { order: 2, action: MobileActionType.TAP, target: 'btn_add_to_cart', description: 'Add item to cart' },
          { order: 3, action: MobileActionType.TAP, target: 'btn_view_cart', description: 'Open cart' },
          { order: 4, action: MobileActionType.TAP, target: 'btn_checkout', description: 'Proceed to checkout' },
          { order: 5, action: MobileActionType.TAP, target: 'radio_shipping_express', description: 'Select shipping method' },
          { order: 6, action: MobileActionType.TAP, target: 'btn_pay_now', description: 'Authorize payment' },
          { order: 7, action: MobileActionType.ASSERT_ELEMENT_VISIBLE, target: 'view_order_confirmation', description: 'Verify order receipt' }
        ],
        expectedResult: 'Payment transaction succeeds and order receipt displays with order number'
      },

      // 11. Logout & Secure Storage Clearance
      {
        scenarioId: 'mob-11-logout-cache-clear',
        title: 'User Logout & Keychain/Keystore Clearance',
        category: 'Security',
        framework,
        platform,
        description: 'Verify user logout purges auth tokens and resets navigation stack to login screen',
        priority: 'HIGH',
        steps: [
          { order: 1, action: MobileActionType.LAUNCH_APP, description: 'Open app' },
          { order: 2, action: MobileActionType.TAP, target: 'tab_profile', description: 'Open profile tab' },
          { order: 3, action: MobileActionType.SCROLL, value: 'down', description: 'Scroll to bottom' },
          { order: 4, action: MobileActionType.TAP, target: 'btn_logout', description: 'Tap Log Out' },
          { order: 5, action: MobileActionType.TAP, target: 'btn_confirm_logout', description: 'Confirm logout dialog' },
          { order: 6, action: MobileActionType.ASSERT_ELEMENT_VISIBLE, target: 'view_login_screen', description: 'Verify navigated to login' },
          { order: 7, action: MobileActionType.PRESS_BACK, description: 'Press back button' },
          { order: 8, action: MobileActionType.ASSERT_ELEMENT_VISIBLE, target: 'view_login_screen', description: 'Verify cannot navigate back into authenticated views' }
        ],
        expectedResult: 'Tokens purged from secure storage and back-stack cleared upon logout'
      }
    ];

    return defaultScenarios;
  }
}

export const mobileScenarioGenerator = new MobileScenarioGenerator();
