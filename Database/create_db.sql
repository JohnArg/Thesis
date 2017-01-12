USE	adhoced;
CREATE TABLE Users (
	id	INT unsigned NOT NULL AUTO_INCREMENT,
    first_name VARCHAR(20) NOT NULL,
    last_name VARCHAR(20) NOT NULL,
    username VARCHAR(20) NOT NULL,
    password VARCHAR(60) NOT NULL,
    PRIMARY KEY (id)
);
CREATE TABLE Networks(
	id INT unsigned NOT NULL AUTO_INCREMENT,
    user_id INT unsigned NOT NULL,
    name VARCHAR(20) NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY fk_user(user_id)
    REFERENCES Users(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);
CREATE TABLE Nodes(
	id INT unsigned NOT NULL AUTO_INCREMENT,
    network_id INT unsigned NOT NULL,
    node_id INT unsigned NOT NULL,
    neighbors VARCHAR(250),
    position_x DOUBLE unsigned NOT NULL,
    position_y DOUBLE unsigned NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY fk_network(network_id)
    REFERENCES Networks(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

