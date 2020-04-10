/*
 * File: c:\Projects\KENYA ONE PROJECT\Frontend-Electron\src\containers\utils\InputGroup.js
 * Project: c:\Projects\KENYA ONE PROJECT\Frontend-Electron
 * Created Date: Friday, April 10th 2020, 10:58:00 am
 * Author: Geoffrey Nyaga Kinyua ( <geoffrey@mfuko.co.ke> )
 * -----
 * Last Modified: Friday April 10th 2020 11:02:33 am
 * Modified By:  Geoffrey Nyaga Kinyua ( <geoffrey@mfuko.co.ke> )
 * -----
 * This file should not be copied and/or distributed without the express
 * permission of MFUKO PAYMENTS SERVICES Ltd.
 * -----
 * Copyright (c) 2020 MFUKO PAYMENTS SERVICES Ltd.
 */

import React from "react";
import PropTypes from "prop-types";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  FormInput,
} from "shards-react";

function MyInputGroup(props) {
  return (
    <InputGroup
      row={true}
      inline={true}
      style={{ marginTop: !props.top ? 10 : 0 }}
    >
      <InputGroupAddon type="prepend">
        <InputGroupText>{props.name}</InputGroupText>
      </InputGroupAddon>
      <FormInput
        type="number"
        placeholder={props.placeholder}
        size="sm"
        //   value={valueX[0] > 0 ? valueX[0] : ""}
        onChange={(e) => {
          e.preventDefault();
        }}
      />
      {props.endNote ? (
        <InputGroupAddon type="prepend">
          <InputGroupText>{props.endNote}</InputGroupText>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  );
}

MyInputGroup.propTypes = {
  top: PropTypes.bool,
  name: PropTypes.string.isRequired,
  placeholder: PropTypes.string.isRequired,
  endNote: PropTypes.string,
};

export default MyInputGroup;
