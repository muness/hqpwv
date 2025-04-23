# HQPWV

HQPWV is a local webserver that allows you to remotely control [HQPlayer](https://www.signalyst.com/consumer.html)  from any device on your network using a web browser.

[End-user installation instructions](https://github.com/zeropointnine/hqpwv/blob/master/readme_enduser.md)

[Discussion thread on audiophilestyle](https://audiophilestyle.com/forums/topic/63831-hqpwv-hqplayer-web-viewer)

Demo video:
[![Demo video](https://i.vimeocdn.com/video/1226369138-b9eb51cefba593dcf444fd1bad72adcfae4474ee2ac765ea22cc37d1d90515b5-d?mw=1920&mh=1080&q=100)](https://vimeo.com/593569610 "Demo video")


# Development setup

1. `cd` to the project directory.

2. Make sure Node.js is installed. Then enter:
`npm install`.

3. To modify the css, make sure `sass` is installed. Then compile with:
`sass scss/main.scss www/css/main.css`
If simply trying to run the project, this step can be skipped, as the compiled css is included in the repository.

4. Make sure [HQPlayer 4](https://www.signalyst.com/consumer.html) is running.

5. Start the server:
`node server/server.js`

6. Browse to the locally served webpage as directed.

Executables are generated with `pkg` by simply entering:
`pkg .`

Front-end code consists of untranspiled, vanilla ES6 classes.


# Docker Deployment

You can run HQPWV in a Docker container (ideal for devices like a NAS or server):

1. Build the Docker image (if not using a prebuilt one from Docker Hub):

    ```bash
    docker build -t muness/hqpwv .
    ```

2. Or pull the latest image from Docker Hub:

    ```bash
    docker pull muness/hqpwv:latest
    ```

3. Run the container with your HQPlayer Desktop's IP:

    ```bash
    docker run -d \
      -p 8080:8000 \
      -e HQPLAYER_HOST=192.168.1.6 \
      --name hqpwv \
      muness/hqpwv:latest
    ```

    - Replace `192.168.1.6` with the actual IP of your HQPlayer Desktop instance.
    - The web UI will then be available at `http://<host-ip>:8080`.

Note: On macOS or Windows hosts, UDP-based HQPlayer discovery is not available inside Docker containers, so using `HQPLAYER_HOST` is required in those environments.
