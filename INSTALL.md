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

2. Create a `.env` file for environment variables:

```bash
   cp .env.example .env
```
   Customize the `.env` file as needed.

3. Start Geoglify using Docker Compose:

```bash
   docker-compose up -d
```

4. Verify that Geoglify is running:

   Open your browser and navigate to [http://localhost:PORT](http://localhost:PORT) (replace `PORT` with the specified port in your `.env` file).

## Usage

Once Geoglify is running, you can start using it by accessing the specified endpoints or integrating it into your applications.

## Additional Configuration

- **Customization:** Explore and modify the configuration files in the `config/` directory to suit your needs.

- **Logging:** Adjust logging settings in the `docker-compose.yml` file if necessary.

## Troubleshooting

If you encounter issues during the installation, refer to the Troubleshooting section in the Geoglify documentation or check the logs for more information.

## Cleanup

To stop Geoglify and remove the containers, run:

```bash
   docker-compose down
```

This completes the installation and setup of Geoglify using Docker Compose. For more detailed information, refer to the official documentation: [Geoglify GitHub Repository](https://github.com/geoglify/geoglify).

Happy mapping!