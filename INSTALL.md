# Geoglify Installation Guide

## Prerequisites

Make sure you have the following installed on your system:

- Docker
- Docker Compose

## Installation Steps

1. Clone the Geoglify repository:

```bash
   git clone https://github.com/geoglify/geoglify.git
   cd geoglify
```

2. Start Geoglify using Docker Compose:

```bash
   docker-compose up -d
```

3. Verify that Geoglify is running:

   Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

## Usage

Once Geoglify is running, you can start using it by accessing the specified endpoints or integrating it into your applications.

## Cleanup

To stop Geoglify and remove the containers, run:

```bash
   docker-compose down
```

This completes the installation and setup of Geoglify using Docker Compose. For more detailed information, refer to the official documentation: [Geoglify GitHub Repository](https://github.com/geoglify/geoglify).

Happy mapping!