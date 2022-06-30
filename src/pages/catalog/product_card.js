import React from "react";
import './Catalogus.css';
import {Card} from "react-bootstrap";
import {Link} from "react-router-dom";


class Product_card extends React.Component {

    render() {

        return (
            <Card className="shadow-sm" style={{minWidth: '15rem', cursor: "pointer", margin: 5, border: "none"}}>
                <Link to="/product" style={{textDecoration: "none", size: "small"}}>
                    <Card.Img className="ListItem-img" width="100%" src={this.props.img} alt="product image"/>
                    <Card.Body>
                        <Card.Title style={{color: "black", size: "card_width"}}>{this.props.title}</Card.Title>
                        <Card.Subtitle className="mb-2 text-muted">
                            {this.props.info}
                        </Card.Subtitle>
                    </Card.Body>
                </Link>
            </Card>
        );
    }
}

export default Product_card;