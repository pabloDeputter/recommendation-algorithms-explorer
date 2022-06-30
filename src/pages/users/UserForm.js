import React, {useState} from "react";
import Form from "react-bootstrap/Form";
import {Row} from "react-bootstrap";
import Col from "react-bootstrap/Col";

const UserForm = ({name, default_val, data, param_value, param_data, onSelect}) => {
    const [value, setValue] = useState(default_val !== null ? default_val : -1);
    return (
        <div>
            <Form className={"pt-3"}>
                <Row className="mb-3">
                    <Form.Group as={Col}>
                        <Form.Select aria-label="Default select example"
                                     value={value}
                                     onChange={(e) => {
                                         setValue(e.target.value);
                                         onSelect(e.target.value);
                                     }}
                        >
                            {
                                default_val !== null ? null
                                    :
                                    <option disabled value={-1}>{name}</option>
                            }
                            {data.map((item, index) => (
                                <option key={index}
                                        value={parseInt(item[param_value])}>{item[param_data]} #{item[param_value]}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Row>
            </Form>
        </div>

    )
}

export default UserForm;