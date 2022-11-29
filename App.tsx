import {useEffect, useRef, useState} from 'react';
import {Alert, StyleSheet, Text, View} from 'react-native';
import {Camera, CameraType} from 'expo-camera';
import {TouchableOpacity} from 'react-native';
import * as FS from 'expo-file-system';
import axios from 'axios';

const token =
  'ya29.c.b0Aa9VdympPuYic-MRvWUZWhRGz0zpddoBx9oUPNF9YTAo1hxGdPFBo6KPyZVwPVY1LWMos-sfk85Ag_dICycRXZuS3sVkCIZpgDJbDMWTgeYVtuzlRB4dbT6UVOxw-3Gs2V4YenLHmB0zlJWOmg29f-ZzSH_x782jOfJihPA0buiQNpUO1G90mS6i8ERII5jvYMsTPJmapGF4mFI6LZLu2WVJXWl0rdU........................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................';

async function uploadToGoogle(uri: string) {
  const data = await FS.readAsStringAsync(uri, {encoding: 'base64'});
  console.log(data.length);
  const resp = await axios.request({
    url: 'https://videointelligence.googleapis.com/v1/videos:annotate',
    method: 'POST',
    data: {
      inputContent: data,
      features: ['LABEL_DETECTION'],
    },
    headers: {
      Authorization: `Bearer ${token}`,
      'X-goog-api-key': 'AIzaSyBd3EqeQwl1nmqRgCuzQvxAfJdhxn-P1YQ',
    },
  });
  console.log(resp.data);
  if (resp.data?.name) {
    await new Promise((r) => setTimeout(r, 2000));
    getOperation(resp.data.name);
  }
}
let lastName: string;

async function getOperation(name: string, retry: number = 0) {
  lastName = name;
  try {
    const resp = await axios.request({
      url: `https://videointelligence.googleapis.com/v1/${name}`,
      headers: {
        Authorization: `Bearer ${token}`,
        'X-goog-api-key': 'AIzaSyBd3EqeQwl1nmqRgCuzQvxAfJdhxn-P1YQ',
      },
    });
    const data = resp.data?.response?.annotationResults;
    if (data?.length) {
      console.log(JSON.stringify(resp.data, null, 2));
      Alert.alert('Result', getDescription(data) ?? 'No result', [
        {text: 'Dismiss'},
      ]);
    } else if (retry < 5) {
      console.log('Retrying...');
      setTimeout(() => getOperation(name, retry + 1), 2000);
    }
  } catch (e: any) {
    console.log(e.response?.data);
  }
}

function getDescription(data: any): any {
  if (!data) {
    return;
  }
  if (Array.isArray(data)) {
    return data
      .map((item) => getDescription(item))
      .filter((item) => item)
      .join(', ');
  }
  if (typeof data == 'object') {
    if (data.description) {
      return data.description;
    }
    return getDescription(Object.values(data));
  }
}

async function clearCache() {
  const videoDir = FS.cacheDirectory! + '/Camera';
  await FS.deleteAsync(videoDir);
}

export default function App() {
  const [started, setStarted] = useState<null | boolean>(null);
  const [ready, setReady] = useState<null | boolean>(null);
  const ref = useRef<Camera>(null);

  useEffect(() => {
    if (!ready || !ref.current) {
      return;
    }
    if (started) {
      ref.current.resumePreview();
      ref.current
        .recordAsync({quality: '480p', maxDuration: 3})
        .then((v) => {
          setStarted(false);
          return uploadToGoogle(v.uri);
        })
        .catch((e) => console.log(JSON.stringify(e.response?.data)));
      return () => ref.current?.stopRecording();
    }
    ref.current.pausePreview();
  }, [ready, started]);

  return (
    <View style={styles.container}>
      {started !== null && (
        <Camera
          ref={ref}
          style={styles.camera}
          type={CameraType.back}
          onCameraReady={() => setReady(true)}
        />
      )}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, started && styles.buttonStarted]}
          onPress={() => setStarted(!started)}
        >
          <Text style={styles.text}>{started ? 'Stop' : 'Start'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => lastName && getOperation(lastName)}
        >
          <Text style={styles.text}>Result</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={clearCache}>
          <Text style={styles.text}>Clear</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    left: 16,
    right: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  button: {
    height: 40,
    borderRadius: 8,
    backgroundColor: '#619854',
    padding: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  buttonStarted: {
    backgroundColor: '#FF635B',
  },
  text: {
    fontWeight: 'bold',
  },
});
