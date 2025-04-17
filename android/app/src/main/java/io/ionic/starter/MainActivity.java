package io.ionic.starter;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import com.google.firebase.FirebaseApp;

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    FirebaseApp.initializeApp(this);
  }
}
