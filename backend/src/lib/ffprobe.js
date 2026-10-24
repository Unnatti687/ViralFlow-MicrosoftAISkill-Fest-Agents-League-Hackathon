const { execFile } = require('child_process');

async function validateVideo(filePath) {
  return new Promise((resolve, reject) => {
    execFile(
      'ffprobe',
      ['-v', 'quiet', '-print_format', 'json', '-show_streams', '-show_format', filePath],
      (err, stdout) => {
        if (err) {
          reject(new Error(`ffprobe failed: ${err.message}`));
          return;
        }

        let data;
        try {
          data = JSON.parse(stdout);
        } catch {
          reject(new Error('ffprobe returned invalid JSON'));
          return;
        }

        const streams = data.streams || [];
        const videoStream = streams.find((s) => s.codec_type === 'video');
        const audioStream = streams.find((s) => s.codec_type === 'audio');

        if (!videoStream) {
          reject(new Error('No video stream found in MP4'));
          return;
        }

        if (videoStream.codec_name !== 'h264') {
          reject(new Error(`Video codec must be H.264, got: ${videoStream.codec_name}`));
          return;
        }

        if (audioStream && audioStream.codec_name !== 'aac') {
          reject(new Error(`Audio codec must be AAC, got: ${audioStream.codec_name}`));
          return;
        }

        const duration = parseFloat(
          videoStream.duration || data.format?.duration || '0'
        );

        if (duration < 5 || duration > 90) {
          reject(new Error(`Duration must be 5–90s, got: ${duration.toFixed(1)}s`));
          return;
        }

        resolve({ codec: videoStream.codec_name, duration });
      }
    );
  });
}

module.exports = { validateVideo };
