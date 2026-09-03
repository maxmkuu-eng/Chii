package com.mkuu.ai;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.graphics.Typeface;
import android.os.Build;
import android.os.Bundle;
import android.telephony.SmsManager;
import android.telephony.SubscriptionInfo;
import android.telephony.SubscriptionManager;
import android.view.Gravity;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {
    // This is used only as an API endpoint. The APK never loads a webpage/WebView.
    private static final String API_BASE = "https://chii-0u0af.faable.link";
    private static final int PERMISSIONS = 4101;

    private final ExecutorService executor = Executors.newCachedThreadPool();
    private final ArrayList<SubscriptionInfo> activeSubscriptions = new ArrayList<>();
    private LinearLayout content;
    private TextView chatOutput;
    private EditText chatInput;
    private Spinner simSpinner;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        requestPermissionsIfNeeded();
        buildNativeUi();
    }

    private void buildNativeUi() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(0xFFFFFFFF);

        TextView header = new TextView(this);
        header.setText("MKUU AI");
        header.setTextSize(24);
        header.setTextColor(0xFF111111);
        header.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        header.setGravity(Gravity.CENTER_VERTICAL);
        header.setPadding(24, 18, 24, 18);
        root.addView(header, new LinearLayout.LayoutParams(-1, 70));

        LinearLayout nav = new LinearLayout(this);
        nav.setPadding(12, 4, 12, 8);
        String[] labels = {"Chat", "SMS", "Auto Reply"};
        for (String label : labels) {
            Button b = new Button(this);
            b.setText(label);
            b.setAllCaps(false);
            b.setOnClickListener(v -> showModule(label));
            nav.addView(b, new LinearLayout.LayoutParams(0, 52, 1));
        }
        root.addView(nav);

        ScrollView scroll = new ScrollView(this);
        content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setPadding(20, 16, 20, 24);
        scroll.addView(content);
        root.addView(scroll, new LinearLayout.LayoutParams(-1, 0, 1));

        setContentView(root);
        showChat();
    }

    private TextView title(String text) {
        TextView v = new TextView(this);
        v.setText(text);
        v.setTextSize(21);
        v.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        v.setTextColor(0xFF111111);
        v.setPadding(0, 8, 0, 16);
        return v;
    }

    private void showModule(String module) {
        if ("SMS".equals(module)) showSms();
        else if ("Auto Reply".equals(module)) showAutoReply();
        else showChat();
    }

    private void showChat() {
        content.removeAllViews();
        content.addView(title("Chat"));

        chatOutput = new TextView(this);
        chatOutput.setText("MKUU AI iko tayari.\n\n");
        chatOutput.setTextSize(16);
        chatOutput.setTextColor(0xFF222222);
        chatOutput.setPadding(4, 8, 4, 18);
        content.addView(chatOutput, new LinearLayout.LayoutParams(-1, 0, 1));

        chatInput = new EditText(this);
        chatInput.setHint("Andika ujumbe...");
        chatInput.setTextSize(16);
        content.addView(chatInput, new LinearLayout.LayoutParams(-1, 60));

        Button send = new Button(this);
        send.setText("Tuma");
        send.setAllCaps(false);
        send.setOnClickListener(v -> sendChat());
        content.addView(send, new LinearLayout.LayoutParams(-1, 56));
    }

    private void sendChat() {
        final String message = chatInput.getText().toString().trim();
        if (message.isEmpty()) return;
        chatOutput.append("\nWewe: " + message + "\n");
        chatInput.setText("");
        executor.execute(() -> {
            try {
                JSONObject body = new JSONObject();
                JSONArray messages = new JSONArray();
                messages.put(new JSONObject().put("role", "user").put("content", message));
                body.put("messages", messages).put("stream", false);
                JSONObject result = NativeApiClient.postJson(API_BASE + "/api/chat", body);
                String reply = result.optString("text", result.optString("reply", "MKUU AI haikupokea jibu."));
                runOnUiThread(() -> chatOutput.append("MKUU AI: " + reply + "\n"));
            } catch (Exception e) {
                runOnUiThread(() -> chatOutput.append("MKUU AI: Seva haipatikani. " + e.getMessage() + "\n"));
            }
        });
    }

    private void showSms() {
        content.removeAllViews();
        content.addView(title("SMS"));
        content.addView(new TextView(this) {{ setText("SMS hutumwa moja kwa moja kupitia SIM ya simu hii."); setTextSize(15); setPadding(0,0,0,16); }});

        EditText recipient = new EditText(this);
        recipient.setHint("Namba ya mpokeaji");
        content.addView(recipient, new LinearLayout.LayoutParams(-1, 60));
        EditText message = new EditText(this);
        message.setHint("Ujumbe");
        content.addView(message, new LinearLayout.LayoutParams(-1, 90));

        simSpinner = new Spinner(this);
        content.addView(simSpinner, new LinearLayout.LayoutParams(-1, 60));
        loadSims();

        Button send = new Button(this);
        send.setText("Tuma SMS");
        send.setAllCaps(false);
        send.setOnClickListener(v -> sendNativeSms(recipient.getText().toString().trim(), message.getText().toString().trim()));
        content.addView(send, new LinearLayout.LayoutParams(-1, 56));
    }

    private void loadSims() {
        ArrayList<String> labels = new ArrayList<>();
        activeSubscriptions.clear();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP && checkSelfPermission(Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
            SubscriptionManager sm = getSystemService(SubscriptionManager.class);
            try {
                List<SubscriptionInfo> list = sm == null ? null : sm.getActiveSubscriptionInfoList();
                if (list != null) {
                    for (SubscriptionInfo info : list) {
                        int slot = info.getSimSlotIndex();
                        if (slot < 0 || slot > 1) continue;
                        activeSubscriptions.add(info);
                        String carrier = info.getCarrierName() == null ? "SIM " + (slot + 1) : info.getCarrierName().toString();
                        String number = info.getNumber();
                        labels.add(carrier + " • SIM " + (slot + 1) + (number == null || number.isEmpty() ? "" : " • " + number));
                    }
                }
            } catch (SecurityException ignored) {}
        }
        if (labels.isEmpty()) labels.add("Hakuna SIM inayopatikana");
        simSpinner.setAdapter(new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item, labels));
    }

    private void sendNativeSms(String recipient, String message) {
        if (recipient.isEmpty() || message.isEmpty()) {
            Toast.makeText(this, "Jaza namba na ujumbe.", Toast.LENGTH_SHORT).show();
            return;
        }
        if (activeSubscriptions.isEmpty()) {
            Toast.makeText(this, "Hakuna SIM inayopatikana.", Toast.LENGTH_LONG).show();
            return;
        }
        try {
            SubscriptionInfo selected = activeSubscriptions.get(simSpinner.getSelectedItemPosition());
            SmsManager sms = getSystemService(SmsManager.class).createForSubscriptionId(selected.getSubscriptionId());
            sms.sendTextMessage(recipient, null, message, null, null);
            Toast.makeText(this, "SMS imetumwa kupitia SIM " + (selected.getSimSlotIndex() + 1), Toast.LENGTH_LONG).show();
        } catch (Exception e) {
            Toast.makeText(this, "SMS imeshindwa: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    private void showAutoReply() {
        content.removeAllViews();
        content.addView(title("Auto Reply"));
        TextView status = new TextView(this);
        status.setText("Auto Reply ya Android\n\nSIM inayotumika kutuma majibu itawekwa kutoka kwenye SIM halisi za simu yako. Hakuna sample numbers.");
        status.setTextSize(16);
        status.setTextColor(0xFF222222);
        status.setPadding(0, 0, 0, 20);
        content.addView(status);

        simSpinner = new Spinner(this);
        content.addView(simSpinner, new LinearLayout.LayoutParams(-1, 60));
        loadSims();

        EditText reply = new EditText(this);
        reply.setHint("Ujumbe wa Auto Reply");
        reply.setMinHeight(100);
        content.addView(reply, new LinearLayout.LayoutParams(-1, 110));

        Button save = new Button(this);
        save.setText("Hifadhi Auto Reply");
        save.setAllCaps(false);
        save.setOnClickListener(v -> Toast.makeText(this, "Mipangilio ya Auto Reply imeandaliwa kwa SIM halisi.", Toast.LENGTH_LONG).show());
        content.addView(save, new LinearLayout.LayoutParams(-1, 56));
    }

    private void requestPermissionsIfNeeded() {
        if (Build.VERSION.SDK_INT < 23) return;
        ArrayList<String> p = new ArrayList<>();
        String[] wanted = {Manifest.permission.SEND_SMS, Manifest.permission.READ_SMS, Manifest.permission.RECEIVE_SMS, Manifest.permission.READ_PHONE_STATE};
        for (String x : wanted) if (checkSelfPermission(x) != PackageManager.PERMISSION_GRANTED) p.add(x);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && checkSelfPermission(Manifest.permission.READ_PHONE_NUMBERS) != PackageManager.PERMISSION_GRANTED) p.add(Manifest.permission.READ_PHONE_NUMBERS);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) p.add(Manifest.permission.POST_NOTIFICATIONS);
        if (!p.isEmpty()) requestPermissions(p.toArray(new String[0]), PERMISSIONS);
    }

    @Override protected void onDestroy() {
        executor.shutdownNow();
        super.onDestroy();
    }
}
