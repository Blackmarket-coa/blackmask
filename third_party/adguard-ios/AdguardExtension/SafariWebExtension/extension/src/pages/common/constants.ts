export enum MessagesToNativeApp {
    GetInitData = 'get_init_data',
    GetContentScriptData = 'get_content_script_data',
}

export enum MessagesToBackgroundPage {
    OpenAssistant = 'open_assistant',
    AddRule = 'add_rule',
    GetPopupData = 'get_popup_data',
    SetPermissionsModalViewed = 'set_permissions_modal_viewed',
    SetProtectionStatus = 'set_protection_status',
    DeleteUserRulesByUrl = 'delete_user_rules_by_url',
    ReportProblem = 'report_problem',
    UpgradeClicked = 'upgrade_clicked',
    EnableAdvancedBlocking = 'enable_advanced_blocking',
    EnableSafariProtection = 'enable_safari_protection',
    RequestContentScriptData = 'request_content_script_data',
}

export enum MessagesToContentScript {
    InitAssistant = 'init_assistant',
}

export enum AppearanceTheme {
    System = 'system',
    Dark = 'dark',
    Light = 'light',
}

export const APPEARANCE_THEME_DEFAULT = AppearanceTheme.System;

export const WEB_EXTENSION_MORE_URL = 'https://link.adtidy.org/forward.html?action=web_extension_more&from=popup&app=ios';

export enum Platform {
    IPad = 'ipad',
    IPhone = 'iphone',
}
