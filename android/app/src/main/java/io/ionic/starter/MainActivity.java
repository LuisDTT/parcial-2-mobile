package io.ionic.starter;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import android.webkit.JavascriptInterface;

import org.jitsi.meet.sdk.JitsiMeetActivity;
import org.jitsi.meet.sdk.JitsiMeetConferenceOptions;

public class MainActivity extends BridgeActivity {

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);


    this.bridge.getWebView().addJavascriptInterface(this, "AndroidJitsi");
  }

  @JavascriptInterface
  public void startJitsiCall(String meetingId) {
    runOnUiThread(() -> {
      JitsiMeetConferenceOptions options = new JitsiMeetConferenceOptions.Builder()
        .setRoom(meetingId)
        .setAudioMuted(false)
        .setVideoMuted(false)
        .build();
      JitsiMeetActivity.launch(this, options);
    });
  }
}
