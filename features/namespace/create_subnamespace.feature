Feature: Create sub-namespace

    Scenario Outline: Creating subnamespaces
        Given "<alice_privatekey>" want to create a subnamespace at "<nodeURL>"
        When Alice add a subnamespace named "<subnamespace>" in the root namespace named "<namespaceName>"
        Then Alice should get a subnamespace transaction hash

        Examples:
            | nodeURL                         | alice_privatekey                                                 | namespaceName | subnamespace     |
            | http://catapult48gh23s.xyz:3000 | FB8F478A2F5AF85BB5C012EEC3A8AF406FAE1379ABC80822DABC6EFEB671072E | namespace_sig | subnamespace_sam |