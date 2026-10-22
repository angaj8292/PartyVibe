package com.partyvibe.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;
import java.net.URI;

@Slf4j
@Configuration
@Profile("prod")
public class DataSourceConfig {

    @Value("${DATABASE_URL:#{null}}")
    private String databaseUrl;

    @Value("${SPRING_DATASOURCE_URL:#{null}}")
    private String springDatasourceUrl;

    @Value("${spring.datasource.username:#{null}}")
    private String defaultUsername;

    @Value("${spring.datasource.password:#{null}}")
    private String defaultPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        String rawUrl = springDatasourceUrl != null ? springDatasourceUrl : databaseUrl;

        HikariConfig config = new HikariConfig();

        if (rawUrl != null && !rawUrl.isBlank()) {
            try {
                // Render and Heroku pass postgres:// or postgresql:// without jdbc: prefix
                if (rawUrl.startsWith("postgres://") || rawUrl.startsWith("postgresql://")) {
                    URI uri = new URI(rawUrl);
                    String host = uri.getHost();
                    int port = uri.getPort() != -1 ? uri.getPort() : 5432;
                    String path = uri.getPath(); // /dbname
                    String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + path;

                    config.setJdbcUrl(jdbcUrl);

                    if (uri.getUserInfo() != null) {
                        String[] userInfo = uri.getUserInfo().split(":");
                        config.setUsername(userInfo[0]);
                        if (userInfo.length > 1) {
                            config.setPassword(userInfo[1]);
                        }
                    }
                    log.info("Configured PostgreSQL DataSource from Render URI: jdbc:postgresql://{}:{}{}", host, port, path);
                } else {
                    config.setJdbcUrl(rawUrl);
                    if (defaultUsername != null) config.setUsername(defaultUsername);
                    if (defaultPassword != null) config.setPassword(defaultPassword);
                }
            } catch (Exception e) {
                log.warn("Could not parse database URI, using raw URL: {}", e.getMessage());
                config.setJdbcUrl(rawUrl.startsWith("jdbc:") ? rawUrl : "jdbc:" + rawUrl);
                if (defaultUsername != null) config.setUsername(defaultUsername);
                if (defaultPassword != null) config.setPassword(defaultPassword);
            }
        } else {
            // Default PostgreSQL
            config.setJdbcUrl("jdbc:postgresql://localhost:5432/partyvibedb");
            config.setUsername(defaultUsername != null ? defaultUsername : "postgres");
            config.setPassword(defaultPassword != null ? defaultPassword : "postgres");
        }

        config.setDriverClassName("org.postgresql.Driver");
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setIdleTimeout(30000);
        config.setMaxLifetime(1800000);
        config.setConnectionTimeout(20000);

        return new HikariDataSource(config);
    }
}
