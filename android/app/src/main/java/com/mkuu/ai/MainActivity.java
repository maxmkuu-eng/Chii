package com.mkuu.ai;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.telephony.SmsManager;
import android.telephony.SubscriptionInfo;
import android.telephony.SubscriptionManager;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.List;

public class MainActivity extends Activity {
    private static final String APP_URL = "https://chii-0u0af.faable.link/";
    private static final int REQUEST_PERMISSIONS = 1001;
    private static final int FILE_CHOOSER = 1002;
    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();
        window.setStatusBarColor(0xFFFFFFFF);
        window.setNavigationBarColor(0xFF000000);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            window.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
        }

        webView = new WebView(this);
        setContentView(webView);

        webView.setOnApplyWindowInsetsListener((view, insets) -> {
            int top = 0;
            int bottom = 0;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars());
                top = bars.top;
                bottom = bars.bottom;
            } else {
                top = insets.getSystemWindowInsetTop();
                bottom = insets.getSystemWindowInsetBottom();
            }
            view.setPadding(0, top, 0, bottom);
            return insets;
        });
        webView.requestApplyInsets();

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);

        webView.addJavascriptInterface(new AndroidSmsBridge(), "MkuuAndroidSms");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme();
                if ("http".equals(scheme) || "https".equals(scheme)) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (Exception ignored) {}
                return true;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> {
                    if (request.getOrigin().toString().startsWith(APP_URL)) {
                        request.grant(request.getResources());
                    } else {
                        request.deny();
                    }
                });
            }

            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                Intent intent = params.createIntent();
                try { startActivityForResult(intent, FILE_CHOOSER); } catch (Exception e) {
                    fileCallback = null;
                    callback.onReceiveValue(null);
                }
                return true;
            }
        });

        requestRuntimePermissions();
        webView.loadUrl(APP_URL);
    }

    private class AndroidSmsBridge {
        @JavascriptInterface
        public String getSimCards() {
            try {
                if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) return "[]";
                if (checkSelfPermission(Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED) return "[]";

                SubscriptionManager manager = getSystemService(SubscriptionManager.class);
                if (manager == null) return "[]";
                List<SubscriptionInfo> active = manager.getActiveSubscriptionInfoList();
                JSONArray result = new JSONArray();
                if (active == null) return result.toString();

                for (SubscriptionInfo info : active) {
                    int slot = info.getSimSlotIndex();
                    if (slot < 0 || slot > 1) continue;
                    JSONObject sim = new JSONObject();
                    String carrier = info.getCarrierName() == null ? "" : info.getCarrierName().toString();
                    String number = "";
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
                            checkSelfPermission(Manifest.permission.READ_PHONE_NUMBERS) == PackageManager.PERMISSION_GRANTED) {
                        number = info.getNumber() == null ? "" : info.getNumber();
                    } else if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
                        number = info.getNumber() == null ? "" : info.getNumber();
                    }
                    sim.put("id", "android-subscription-" + info.getSubscriptionId());
                    sim.put("slotIndex", slot);
                    sim.put("slotLabel", "SIM " + (slot + 1));
                    sim.put("carrierName", carrier);
                    sim.put("displayName", carrier.isEmpty() ? "SIM " + (slot + 1) : carrier + " • SIM " + (slot + 1));
                    sim.put("phoneNumber", number);
                    sim.put("isAvailable", true);
                    result.put(sim);
                }
                return result.toString();
            } catch (Exception e) {
                return "[]";
            }
        }

        @JavascriptInterface
        public String sendSms(String recipient, String content, int slotIndex) {
            try {
                if (checkSelfPermission(Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) {
                    return "{\"success\":false,\"error\":\"SEND_SMS permission haijatolewa.\"}";
                }
                if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
                    SmsManager.getDefault().sendTextMessage(recipient, null, content, null, null);
                    return "{\"success\":true}";
                }
                SubscriptionManager manager = getSystemService(SubscriptionManager.class);
                if (manager == null) return "{\"success\":false,\"error\":\"SubscriptionManager haipatikani.\"}";
                if (checkSelfPermission(Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED) {
                    return "{\"success\":false,\"error\":\"READ_PHONE_STATE permission haijatolewa.\"}";
                }
                List<SubscriptionInfo> active = manager.getActiveSubscriptionInfoList();
                SubscriptionInfo selected = null;
                if (active != null) {
                    for (SubscriptionInfo info : active) {
                        if (info.getSimSlotIndex() == slotIndex) { selected = info; break; }
                    }
                }
                if (selected == null) return "{\"success\":false,\"error\":\"SIM " + (slotIndex + 1) + " haipatikani.\"}";
                SmsManager sms = getSystemService(SmsManager.class).createForSubscriptionId(selected.getSubscriptionId());
                sms.sendTextMessage(recipient, null, content, null, null);
                return "{\"success\":true}";
            } catch (Exception e) {
                String message = e.getMessage() == null ? "SMS imeshindwa kutumwa." : e.getMessage().replace("\\", "\\\\").replace("\"", "\\\"");
                return "{\"success\":false,\"error\":\"" + message + "\"}";
            }
        }
    }

    private void requestRuntimePermissions() {
        if (Build.VERSION.SDK_INT >= 23) {
            java.util.ArrayList<String> permissions = new java.util.ArrayList<>();
            String[] wanted = new String[] {
                    Manifest.permission.RECORD_AUDIO,
                    Manifest.permission.CAMERA,
                    Manifest.permission.READ_SMS,
                    Manifest.permission.RECEIVE_SMS,
                    Manifest.permission.SEND_SMS,
                    Manifest.permission.READ_PHONE_STATE
            };
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                permissions.add(Manifest.permission.READ_PHONE_NUMBERS);
            }
            for (String permission : wanted) {
                if (checkSelfPermission(permission) != PackageManager.PERMISSION_GRANTED) permissions.add(permission);
            }
            java.util.LinkedHashSet<String> unique = new java.util.LinkedHashSet<>(permissions);
            if (!unique.isEmpty()) requestPermissions(unique.toArray(new String[0]), REQUEST_PERMISSIONS);
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER && fileCallback != null) {
            Uri[] result = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
            fileCallback.onReceiveValue(result);
            fileCallback = null;
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }
}
