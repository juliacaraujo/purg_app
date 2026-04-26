import React from "react";
import { StyleSheet, View } from "react-native";
import { Video, ResizeMode } from "expo-av";

type Props = { onConcluido: () => void };

export default function VideoAbertura({ onConcluido }: Props) {
  const source = require("../../../assets/purg_video_abertura.mp4");

  return (
    <View style={styles.container}>
      <Video
        source={source}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping={false}
        isMuted
        onPlaybackStatusUpdate={(status) => {
          if (status.isLoaded && status.didJustFinish) {
            onConcluido();
          }
        }}
        onError={onConcluido}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, backgroundColor: "#000", zIndex: 999 },
});
