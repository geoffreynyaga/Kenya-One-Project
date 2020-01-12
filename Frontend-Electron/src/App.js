import React, { Component } from "react";
import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      groups: null,
      isLoading: false
    };
  }
  fetchGroups = () => {
    let thisComp = this;
    fetch("http://localhost:8000/api/accounts/example/")
      .then(response => {
        return response.json();
      })
      .then(myJson => {
        console.log(myJson);
        thisComp.setState({
          groups: myJson,
          isLoading: false
        });
      })
      .catch(error => {
        console.log(error, "error");
      });
  };
  render() {
    console.log(this.state.groups == [], "shoud be False");
    console.log(this.state.groups == [], "shoud be True");
    console.log(this.state.groups === [], "shoud be True");

    return (
      <div>
        <h1>Groups</h1>
        <button
          onClick={() => {
            this.setState(
              {
                isLoading: true
              },
              this.fetchGroups()
            );
          }}
        >
          Fetch Groups
        </button>
        {/* <p>{JSON.stringify(this.state.groups)}</p> */}

        {this.state.isLoading ? <p>Calculating....</p> : ""}

        {this.state.groups !== null ? (
          <img src={`data:image/png;base64,${this.state.groups.image}`} />
        ) : (
          ""
        )}
      </div>
    );
  }
}

export default App;
